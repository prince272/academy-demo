using Academy.Clients.CacheClient;
using Academy.Clients.EmailClient;
using Academy.Clients.FileClient;
using Academy.Clients.PaymentClient;
using Academy.Clients.SmsClient;
using Academy.Clients.ViewClient;
using Academy.Data;
using Academy.Entities;
using Academy.Models;
using Academy.Utilities;
using Academy.Validators;
using Humanizer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Services
{
    public class UserService
    {
        private readonly IServiceProvider _services;
        private readonly UserManager<User> userManager;
        private readonly RoleManager<Role> roleManager;
        private readonly SignInManager<User> loginManager;
        private readonly IViewClient viewClient;
        private readonly IEmailClient emailClient;
        private readonly ISmsClient smsClient;
        private readonly ICacheClient cacheClient;
        private readonly HttpContext httpContext;
        private readonly IFileClient fileClient;
        private readonly IPaymentClient paymentClient;
        private readonly AppDbContext dbContext;

        private const int MAX_USER_PAGE_SIZE = 20;

        public UserService(IServiceProvider services)
        {
            _services = services;
            userManager = services.GetRequiredService<UserManager<User>>();
            roleManager = services.GetRequiredService<RoleManager<Role>>();
            loginManager = services.GetRequiredService<SignInManager<User>>();
            viewClient = services.GetRequiredService<IViewClient>();
            emailClient = services.GetRequiredService<IEmailClient>();
            smsClient = services.GetRequiredService<ISmsClient>();
            cacheClient = services.GetRequiredService<ICacheClient>();
            httpContext = services.GetRequiredService<IHttpContextAccessor>().HttpContext;
            fileClient = services.GetRequiredService<IFileClient>();
            paymentClient = services.GetRequiredService<IPaymentClient>();
            dbContext = services.GetRequiredService<AppDbContext>();
        }

        public async Task<Result> RegisterAsync(RegisterModel model)
        {
            var result = await ServiceHelper.ValidateAsync<RegisterValidator, RegisterModel>(_services, model);

            if (!result.Success)
                return result;

            var user = new User();
            user.Email = model.Email;
            user.PhoneNumber = model.PhoneNumber;
            user.PreferredName = model.PreferredName;
            user.UserName = $"{StringHelper.SanitizeText(model.PreferredName, separator: "_").ToLowerInvariant()}_" +
                            $"{ComputeHelper.GenerateRandomString(3, ComputeHelper.WHOLE_NUMERIC_CHARS)}";
            user.CreatedOn = DateTimeOffset.UtcNow;


            var identityResult = await userManager.CreateAsync(user, model.Password);

            if (!identityResult.Succeeded)
            {
                return Result.Failed(identityResult);
            }
            else
            {
                if (await userManager.Users.LongCountAsync() == 1)
                {
                    if (!await roleManager.RoleExistsAsync(Constants.AdminRole))
                        await roleManager.CreateAsync(new Role() { Name = Constants.AdminRole });

                    await userManager.AddToRoleAsync(user, Constants.AdminRole);
                }

                return Result.Succeed();
            }
        }

        public async Task<Result> LoginAsync(LoginModel model)
        {
            var result = await ServiceHelper.ValidateAsync<LoginValidator, LoginModel>(_services, model);

            if (!result.Success)
                return result;

            if (model.Provider == AccountProvider.Email || model.Provider == AccountProvider.PhoneNumber)
            {
                var user = model.Provider == AccountProvider.Email ? await userManager.FindByEmailAsync(model.Email) :
                           model.Provider == AccountProvider.PhoneNumber ? await userManager.FindByPhoneNumber(model.PhoneNumber) : null;

                if (user == null)
                    return Result.Failed(StatusCodes.Status401Unauthorized, message: "Your account was not found.");

                var loginResult = await loginManager.PasswordSignInAsync(user, model.Password, true, true);

                if (model.Provider == AccountProvider.Email && !user.EmailConfirmed)
                    return Result.Failed(StatusCodes.Status403Forbidden, action: ResultAction.Confirm);

                else if (model.Provider == AccountProvider.PhoneNumber && !user.PhoneNumberConfirmed)
                    return Result.Failed(StatusCodes.Status403Forbidden, action: ResultAction.Confirm);
                
                if (!loginResult.Succeeded)
                {
                    return Result.Failed(loginResult);
                }

                return Result.Succeed();
            }
            else
            {
                throw new NotImplementedException();
            }
        }

        public async Task<Result> LogoutAsync()
        {
            await loginManager.SignOutAsync();

            return Result.Succeed();
        }

        public async Task<Result> SendCodeAsync(UserCodeModel model)
        {
            var result = await ServiceHelper.ValidateAsync<UserCodeValidator, UserCodeModel>(_services, model);

            if (!result.Success)
                return result;

            var cacheKey = ComputeHelper.ComposeMethodKey(MethodHelper.GetMethodInfo<UserCodeModel, Task>(SendCodeAsync), model);

            // TODO: Review code changes to ensure their synchronized.
            var user = await userManager.FindByIdAsync(model.CurrentId) ??
                ((model.Provider == AccountProvider.Email) ? await userManager.FindByEmailAsync(model.Email) :
                 (model.Provider == AccountProvider.PhoneNumber) ? await userManager.FindByPhoneNumber(model.PhoneNumber) :
                 throw new NotImplementedException());

            if (user == null)
                return Result.Failed(StatusCodes.Status404NotFound);

            if (model.Action == AccountAction.Confirm)
            {
                var message = await cacheClient.GetAsync(cacheKey, async () =>
                 {
                     model.Code = model.Provider == AccountProvider.Email ? await userManager.GenerateChangeEmailTokenAsync(user, model.Email) : 
                                  model.Provider == AccountProvider.PhoneNumber ? await userManager.GenerateChangePhoneNumberTokenAsync(user, model.PhoneNumber) :
                                  throw new NotImplementedException();;

                     return await viewClient.RenderViewToStringAsync($"~/Views/{Enum.GetName(model.Provider)}_SecurityCode.cshtml", model);
                 });

                if (model.Provider == AccountProvider.Email)
                    emailClient.SendAsync(model.Email, $"{model.Action.GetDisplayName()} Your Account", message).Forget();

                else if (model.Provider == AccountProvider.PhoneNumber)
                    smsClient.SendAsync(model.PhoneNumber, $"{model.Action.GetDisplayName()} Your Account", message).Forget();

                return Result.Succeed();
            }
            else if (model.Action == AccountAction.Recover)
            {
                var message = await cacheClient.GetAsync(cacheKey, async () =>
                {
                    model.Code = await userManager.GeneratePasswordResetTokenAsync(user);

                    if (string.IsNullOrWhiteSpace(model.Code))
                        throw new InvalidOperationException("The security token cannot be null, empty, or consists only of white-space.");

                    return await viewClient.RenderViewToStringAsync($"~/Views/{Enum.GetName(model.Provider)}_SecurityCode.cshtml", model);
                });

                if (model.Provider == AccountProvider.Email)
                    emailClient.SendAsync(model.Email, $"{model.Action.GetDisplayName()} Your Account", message).Forget();

                else if (model.Provider == AccountProvider.PhoneNumber)
                    smsClient.SendAsync(model.PhoneNumber, $"{model.Action.GetDisplayName()} Your Account", message).Forget();

                return Result.Succeed();
            }
            else
            {
                throw new NotImplementedException();
            }
        }

        public async Task<Result> ReceiveCodeAsync(UserCodeModel model)
        {
            var result = await ServiceHelper.ValidateAsync<UserCodeValidator, UserCodeModel>(_services, model);

            if (!result.Success)
                return result;

            // TODO: Review code changes to ensure their synchronized.
            var user = await userManager.FindByIdAsync(model.CurrentId) ?? 
                ((model.Provider == AccountProvider.Email) ? await userManager.FindByEmailAsync(model.Email) :
                 (model.Provider == AccountProvider.PhoneNumber) ? await userManager.FindByPhoneNumber(model.PhoneNumber) :
                 throw new NotImplementedException());

            if (user == null)
                return Result.Failed(StatusCodes.Status404NotFound);


            if (model.Action == AccountAction.Confirm)
            {
                var identityResult = model.Provider == AccountProvider.Email ? await userManager.ChangeEmailAsync(user, model.Email, model.Code) :
                                     model.Provider == AccountProvider.PhoneNumber ? await userManager.ChangePhoneNumberAsync(user, model.PhoneNumber, model.Code) :
                                     throw new NotImplementedException();

                return !identityResult.Succeeded ? Result.Failed(identityResult) : Result.Succeed();
            }
            else if (model.Action == AccountAction.Recover)
            {
                var identityResult = await userManager.ResetPasswordAsync(user, model.Code, model.Password);
                return !identityResult.Succeeded ? Result.Failed(identityResult) : Result.Succeed();
            }
            else
            {
                throw new NotImplementedException();
            }
        }

        public async Task<Result> EditCurrentUserAsync(UserEditModel model)
        {
            var result = await ServiceHelper.ValidateAsync<UserEditValidator, UserEditModel>(_services, model);

            if (!result.Success)
                return result;

            var currentUser = await httpContext.GetCurrentUserAsync();
            currentUser.PreferredName = model.PreferredName;
            currentUser.UserName = model.UserName;
            currentUser.Bio = model.Bio;
            currentUser.Location = model.Location;
            currentUser.AvatarId = model.AvatarId;
            // TODO: Attach current user to the db context so that changes to the current user could be tracked.
            currentUser.Avatar = null;

            var identityResult = await userManager.UpdateAsync(currentUser);
            return !identityResult.Succeeded ? Result.Failed(identityResult) : Result.Succeed();
        }

        public async Task<Result> GetCurrentUserAsync()
        {
            var currentUserId = (await httpContext.GetCurrentUserAsync())?.Id ?? 0;
            return await GetSingleOrMultipleUserAsync(new UserSearchModel { Id = currentUserId }, multiple: false);
        }

        public async Task<Result> GetSingleOrMultipleUserAsync(UserSearchModel search, bool multiple)
        {
            var currentUser = await httpContext.GetCurrentUserAsync();
            var currentUserIsInAdmin = currentUser != null && await userManager.IsInRoleAsync(currentUser, Constants.AdminRole);

            var query = dbContext.Set<User>().AsQueryable().AsSplitQuery();

            query = query.Include(x => x.Avatar)
                    .Include(x => x.Roles).ThenInclude(x => x.Role)
                    .Include(x => x.Certificates)
                    .Include(x => x.ContentProgresses)
                    .Include(x => x.Payments);

            if (search.Id != null)
            {
                query = query.Where(x => x.Id == search.Id);
            }

            if (search.CourseIds != null)
            {
                var contentIds = await dbContext.Set<Course>()
                    .Where(x => search.CourseIds.Contains(x.Id))
                    .SelectMany(x => x.Sections)
                    .SelectMany(x => x.Lessons)
                    .SelectMany(x => x.Contents)
                    .Select(x => x.Id)
                    .ToArrayAsync();

                query = query.Where(x => x.ContentProgresses.Any(contentProgres => contentIds.Contains(contentProgres.ContentId)));
            }

           async Task<object> selector(User user)
            {
                // Courses that the user is taking.
                var courses = (await ServiceHelper.GetCourseDetailsListAsync(_services, user))
                    .Where(course => course.Sections.SelectMany(section => section.Lessons).SelectMany(lesson => lesson.Contents).Any(content => user.ContentProgresses.Any(contentProgress => content.Id == contentProgress.ContentId)));

                bool ignoreUserProperty() => !currentUserIsInAdmin && (currentUser?.Id != user.Id);


                var userXp = user.ContentProgresses.Where(x => x.Checked).Select(x => x.Points).Sum();
                var userXPExpected = (courses.SelectMany(x => x.Sections).SelectMany(x => x.Lessons).SelectMany(x => x.Contents)).Count() * Settings.AppSettings.Grading.Points;

                var followingCount = await dbContext.Set<UserFollower>().Where(x => x.UserId == user.Id).LongCountAsync();

                var followersCount = await dbContext.Set<UserFollower>()
                    .Where(x => x.MentorId == user.Id)
                    .LongCountAsync();

                var following = await dbContext.Set<UserFollower>()
                                              .AnyAsync(x =>
                                                (x.UserId == (currentUser != null ? currentUser.Id : 0)) &&
                                                (x.MentorId == user.Id));

                var contents = courses
                    .SelectMany(course => course.Sections
                    .SelectMany(section => section.Lessons
                    .SelectMany(lesson => lesson.Contents
                    .Select(content => new
                    {
                        CourseId = course.Id,
                        CourseTitle = course.Title,
                        SectionId = section.Id,
                        SectionTitle = section.Title,
                        LessonId = lesson.Id,
                        LessonTitle = lesson.Title,
                        Id = content.Id,
                        Status = content.Status,
                    }))))
                    .ToList();

                var contentsCount = contents.Count;
                var contentsComplete = contents.Where(x => x.Status == ContentStatus.Completed).Count();

                var progress = contentsCount != 0 ? Math.Round(contentsComplete * 100m / contentsCount / 100m, 2, MidpointRounding.AwayFromZero) : 0;

                var recentContentProgress = user.ContentProgresses.OrderBy(x => x.UpdatedOn).FirstOrDefault();
                var recentContent = contents.FirstOrDefault(x => x.Id == recentContentProgress?.ContentId);

                var data = TypeMerger
                    .Ignore(() => user.Email, ignoreUserProperty)
                    .Ignore(() => user.EmailConfirmed, ignoreUserProperty)
                    .Ignore(() => user.PhoneNumber, ignoreUserProperty)
                    .Ignore(() => user.PhoneNumberConfirmed, ignoreUserProperty)
                    .Merge(new
                    {
                        user.Id,
                        user.PhoneNumber,
                        user.PhoneNumberConfirmed,
                        user.Email,
                        user.EmailConfirmed,
                        user.UserName,
                        user.PreferredName,
                        user.Bio,
                        user.Location,
                        user.CreatedOn,
                        user.AvatarId,
                        FollowersCount = followersCount,
                        FollowingCount = followingCount,
                        Following = following,
                        Xp = userXp,
                        RecentContent = recentContent,
                        Level = Settings.AppSettings.Grading.GetComputedValue(Enumerable.Range(1, 10).ToArray(), userXp, userXPExpected),
                        Medal = Settings.AppSettings.Grading.GetComputedValue(Enum.GetValues<AppSettings.GradeMedal>(), userXp, userXPExpected),
                        Progress = progress,
                        Avatar = user.Avatar != null ? TypeMerger.Merge(new { FileUrl = fileClient.GetFileUrl(user.Avatar.FileName) }, user.Avatar) : null,
                        Roles = user.Roles.Select(role => role.Role.Name.Camelize()).ToList(),
                        Certificates = user.Certificates.Select(certificate => TypeMerger.Ignore(() => certificate.User)
                        .Merge(new { FileUrl = fileClient.GetFileUrl(certificate.FileName) }, certificate)).ToList(),
                        Courses = courses.Select(x => TypeMerger.Ignore(() => x.Sections).Merge(new { }, x)).ToList()
                    }, new { });

                return data;
            }

            if (multiple)
            {
                var page = new Page(search.PageNumber.GetValueOrDefault(1), MAX_USER_PAGE_SIZE, await query.CountAsync());
                var pageItems = await (await query.Subset(page).ToListAsync()).SelectAsync(selector);
                return Result.Succeed(TypeMerger.Merge(new { Items = pageItems }, page));
            }
            else
            {
                var user = await query.FirstOrDefaultAsync();
                if (user != null) return Result.Succeed(await selector(user));

                return Result.Failed(StatusCodes.Status404NotFound);
            }
        }

        public async Task<Result> ChangePasswordAsync(ChangePasswordModel model)
        {
            var result = await ServiceHelper.ValidateAsync<ChangePasswordValidator, ChangePasswordModel>(_services, model);

            if (!result.Success)
                return result;

            var currentUser = await httpContext.GetCurrentUserAsync();
            var identityResult = await userManager.ChangePasswordAsync(currentUser, model.CurrentPassword, model.NewPassword);
            return !identityResult.Succeeded ? Result.Failed(identityResult) : Result.Succeed();
        }

        public async Task<Result> ProcessPaymentAsync(PaymentProcessModel model)
        {
            var result = await ServiceHelper.ValidateAsync<PaymentProcessValidator, PaymentProcessModel>(_services, model);

            if (!result.Success)
                return result;

            var currentUser = await httpContext.GetCurrentUserAsync();

            var paymentAmount = await ((Func<Task<decimal>>)(async () =>
            {
                switch (model.Purpose)
                {
                    case PaymentPurpose.Learn:
                        {
                            var courses = await dbContext.Set<Course>()
                            .Where(x => model.RefArray.Contains(x.Id.ToString()))
                            .Select(x => new { x.Id, x.Fee }).ToArrayAsync();

                            var amount = default(decimal);

                            if (model.Duration != null)
                            {
                                amount = Math.Round((courses.Sum(x => x.Fee) / 30), 2, MidpointRounding.AwayFromZero) * Math.Round((decimal)model.Duration.Value.TotalDays, 2, MidpointRounding.AwayFromZero);
                            }
                            else
                            {
                                amount = courses.Sum(x => x.Fee);
                            }

                            return amount;
                        }

                    default: throw new InvalidOperationException();
                }
            }))();

            var transactionId = paymentClient.GenerateTransactionId();

            var payment = new Payment
            {
                AccountId = currentUser.Id,
                AccountName = currentUser.PreferredName,
                AccountPhoneNumber = currentUser.PhoneNumber,
                AccountEmail = currentUser.Email,
                AccountBalance = currentUser.Balance,

                CreatedOn = DateTimeOffset.UtcNow,
                UpdatedOn = DateTimeOffset.UtcNow,

                Purpose = model.Purpose,
                Period = model.Period,
                RefString = model.RefString,
                TransactionId = transactionId,
                RedirectUrl = QueryHelpers.AddQueryString(model.RedirectUrl, nameof(transactionId), transactionId),

                Amount = paymentAmount,
            };

            await paymentClient.ProcessAsync(payment);

            if (payment.Status == PaymentStatus.Pending)
            {
                return Result.Succeed(data: new { payment.CheckoutUrl });
            }

            return Result.Failed(StatusCodes.Status400BadRequest, message: payment.StatusMessage);
        }

        public async Task<Result> VerifyPaymentAsync(PaymentVerifyModel model)
        {
            var payment = await dbContext.Set<Payment>().FirstOrDefaultAsync(x => x.TransactionId == model.TransactionId);
            if (payment == null)
                return Result.Failed(StatusCodes.Status404NotFound);

            await paymentClient.VerifyAsync(payment);

            if (payment.Status == PaymentStatus.Succeeded)
            {
                return Result.Succeed();
            }

            return Result.Failed(StatusCodes.Status400BadRequest, message: payment.StatusMessage);
        }

        public async Task<Result> FollowUserAsync(long userId, bool toggle)
        {
            var currentUser = await httpContext.GetCurrentUserAsync();

            var follower = await dbContext.Set<UserFollower>()
                                          .FirstOrDefaultAsync(x =>
                                            (x.UserId == currentUser.Id) &&
                                            (x.MentorId == userId));

            if (toggle)
            {
                if (currentUser.Id == userId)
                {
                    return Result.Failed(StatusCodes.Status400BadRequest, message: "You can't follow for your own account.");
                }

                if (follower == null)
                {
                    follower = new UserFollower
                    {
                        UserId = currentUser.Id,
                        MentorId = userId,
                    };

                    dbContext.Add(follower);
                    await dbContext.SaveChangesAsync();
                }

                return Result.Succeed();
            }
            else
            {
                if (follower != null)
                {
                    dbContext.Remove(follower);
                    await dbContext.SaveChangesAsync();
                }

                return Result.Succeed();
            }
        }
    }
}