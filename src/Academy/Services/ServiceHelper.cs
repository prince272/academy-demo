using Academy.Clients.FileClient;
using Academy.Data;
using Academy.Entities;
using Academy.Models;
using Academy.Utilities;
using FluentValidation;
using Humanizer;
using Humanizer.Localisation;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json.Serialization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Services
{
    public static class ServiceHelper
    {
        public static async Task<Result> ValidateAsync<TValidator, TModel>(IServiceProvider services, TModel model)
            where TValidator : AbstractValidator<TModel>
        {
            if (model == null)
                throw new ArgumentNullException(nameof(model));

            var validatorType = typeof(TValidator);

            // How do I check if a type provides a parameterless constructor?
            // source: https://stackoverflow.com/questions/4681031/how-do-i-check-if-a-type-provides-a-parameterless-constructor
            var validator = (TValidator)(validatorType.GetConstructor(Type.EmptyTypes) != null ?
                 Activator.CreateInstance(validatorType) :
                 Activator.CreateInstance(validatorType, services));

            var validationResult = await validator.ValidateAsync(model);

            if (!validationResult.IsValid)
            {
                var resolver = Settings.SerializerSettings.ContractResolver as DefaultContractResolver;

                var errors = validationResult.Errors.Select(x => new
                {
                    Key = resolver.GetResolvedPropertyName(x.PropertyName),
                    Value = x.ErrorMessage
                }).GroupBy(x => x.Key, StringComparer.OrdinalIgnoreCase)
                  .ToDictionary(x => x.Key, x => x.First().Value, StringComparer.OrdinalIgnoreCase);

                return Result.Failed(StatusCodes.Status400BadRequest, message: errors.First().Value, errors: errors);
            }

            return Result.Succeed();
        }

        public static async Task<List<CourseDetailsModel>> GetCourseDetailsListAsync(IServiceProvider services, User user)
        {
            var userManager = services.GetRequiredService<UserManager<User>>();
            var dbContext = services.GetRequiredService<AppDbContext>();
            var fileClient = services.GetRequiredService<IFileClient>();
            var httpContext = services.GetRequiredService<IHttpContextAccessor>().HttpContext;
            var cacheKey = ComputeHelper.ComposeMethodKey(MethodHelper.GetMethodInfo<IServiceProvider, User, Task>(GetCourseDetailsListAsync), user?.Id);

            var result = httpContext.Items[cacheKey] as List<CourseDetailsModel>;

            if (result == null)
            {
                var userIsInAdmin = user != null && await userManager.IsInRoleAsync(user, Constants.AdminRole);
           
                var query = dbContext.Set<Course>().AsQueryable().AsSplitQuery();

                // Hide all unpublished courses if the user is not in the admin role.
                query = query.Where(x => userIsInAdmin || x.Published);

                query = query
                    .Include(x => x.Image)
                    .Include(x => x.CertificateTemplate)
                    .Include(x => x.Sections).ThenInclude(x => x.Lessons);

                var courses = (await query.ToListAsync()).OrderBy(x => x.Priority == 0).ThenBy(x => x.Priority).ToList();

                async Task<CourseDetailsModel> selector(Course course)
                {
                    var hasStartedFirstContent = false;

                    var sections = (await course.Sections.OrderBy(x => x.Priority == 0).ThenBy(x => x.Priority).SelectAsync(async section =>
                    {
                        var lessons = (await section.Lessons.OrderBy(x => x.Priority == 0).ThenBy(x => x.Priority).SelectAsync(async lesson =>
                        {
                            var contents = (await dbContext.Set<Content>().Where(x => x.LessonId == lesson.Id).Select(content => new
                            {
                                content.LessonId,
                                content.Id,
                                content.Priority,
                                content.QuestionType,
                                content.Duration,
                                QuestionChoice = content.QuestionAnswers.Where(x => x.Correct).Count() >= 2 ? QuestionChoice.Multiple : QuestionChoice.Single
                            }).ToListAsync()).OrderBy(x => x.Priority == 0).ThenBy(x => x.Priority).GroupJoin(user?.ContentProgresses.Where(x => x.Checked) ?? Array.Empty<ContentProgress>(),
                                content => content.Id, contentProgress => contentProgress.ContentId, (content, contentProgresses) =>
                                {
                                    var contentStatus = contentProgresses.Any() ? ContentStatus.Completed : ContentStatus.Locked;
                                    if (!hasStartedFirstContent && contentStatus == ContentStatus.Locked)
                                    {
                                        contentStatus = ContentStatus.Started;
                                        hasStartedFirstContent = true;
                                    }

                                    return new CourseDetailsModel.ContentModel
                                    {
                                        LessonId = content.LessonId,
                                        Id = content.Id,
                                        Priority = content.Priority,
                                        QuestionType = content.QuestionType,
                                        QuestionChoice = content.QuestionChoice,
                                        Duration = content.Duration,
                                        Status = contentStatus,
                                    };
                                }).ToList();

                            var contentsCount = contents.Count();
                            var contentsComplete = contents.Where(x => x.Status == ContentStatus.Completed).Count();
                            var contentsDuration = contents.Select(x => x.Duration).Sum();

                            return new CourseDetailsModel.LessonModel
                            {
                                SectionId = lesson.SectionId,
                                Id = lesson.Id,
                                Priority = lesson.Priority,
                                Title = lesson.Title,
                                Duration = contentsDuration,
                                Contents = contents,
                                Progress = contentsCount != 0 ? Math.Round(contentsComplete * 100m / contentsCount / 100m, 2, MidpointRounding.AwayFromZero) : 1,
                                Status = contents.All(x => x.Status == ContentStatus.Locked) ? ContentStatus.Locked : contents.All(x => x.Status == ContentStatus.Completed) ? ContentStatus.Completed : ContentStatus.Started,
                            };
                        })).ToList();

                        var contents = lessons.SelectMany(x => x.Contents);
                        var contentsCount = contents.Count();
                        var contentsComplete = contents.Where(x => x.Status == ContentStatus.Completed).Count();
                        var contentsDuration = contents.Select(x => x.Duration).Sum();

                        return new CourseDetailsModel.SectionModel
                        {
                            CourseId = section.CourseId,
                            Id = section.Id,
                            Priority = section.Priority,
                            Title = section.Title,
                            Lessons = lessons,
                            Duration = contentsDuration,
                            Progress = contentsCount != 0 ? Math.Round(contentsComplete * 100m / contentsCount / 100m, 2, MidpointRounding.AwayFromZero) : 1,
                            Status = lessons.All(x => x.Status == ContentStatus.Locked) ? ContentStatus.Locked : lessons.All(x => x.Status == ContentStatus.Completed) ? ContentStatus.Completed : ContentStatus.Started,
                        };
                    })).ToList();

                    var contents = sections.SelectMany(x => x.Lessons).SelectMany(x => x.Contents).ToList();
                    var contentsCount = contents.Count();
                    var contentsComplete = contents.Where(x => x.Status == ContentStatus.Completed).Count();
                    var contentsDuration = contents.Select(x => x.Duration).Sum();

                    var courseCertificate = user?.Certificates.FirstOrDefault(x => x.CourseId == course.Id);

                    var coursePayment = user?.Payments
                        .Where(x => x.Purpose == PaymentPurpose.Learn)
                        .Where(x => x.RefString != null && x.RefString.Split(",").Contains(course.Id.ToString()))
                        .Where(x => x.Period == null || DateTimeOffset.UtcNow >= x.Period)
                        .Where(x => x.Status == PaymentStatus.Succeeded)
                        .FirstOrDefault();

                    var courseProgress = contentsCount != 0 ? Math.Round(contentsComplete * 100m / contentsCount / 100m, 2, MidpointRounding.AwayFromZero) : 1;
                    var courseStatus = sections.All(x => x.Status == ContentStatus.Locked) ? ContentStatus.Locked : sections.All(x => x.Status == ContentStatus.Completed) ? ContentStatus.Completed : ContentStatus.Started;

                    var courseStartedOn = (courseStatus == ContentStatus.Started || courseStatus == ContentStatus.Completed ? (user?.ContentProgresses ?? Array.Empty<ContentProgress>())
                    .Where(contentProgress => contents.Any(content => content.Id == contentProgress.ContentId))
                    .OrderBy(contentProgress => contentProgress.CreatedOn).FirstOrDefault() : null)?.CreatedOn;

                    var courseCompletedOn = (courseStatus == ContentStatus.Completed ? (user?.ContentProgresses ?? Array.Empty<ContentProgress>())
                    .Where(contentProgress => contents.Any(content => content.Id == contentProgress.ContentId))
                    .OrderByDescending(contentProgress => contentProgress.CreatedOn).FirstOrDefault() : null)?.CreatedOn;

                    var learnersCount = await dbContext.Set<User>().AsSplitQuery()
                    .Where(u => u.ContentProgresses.Any(contentProgress => contents.Select(x => x.Id).Contains(contentProgress.ContentId))).LongCountAsync();

                    var contentsCorrectCount = (user?.ContentProgresses.Where(x => x.Checked) ?? Array.Empty<ContentProgress>()).Where(contentProgress => contents.Any(content => content.Id == contentProgress.ContentId)).Where(x => x.Correct).Count();
                    var contentsWrongCount = (user?.ContentProgresses.Where(x => x.Checked) ?? Array.Empty<ContentProgress>()).Where(contentProgress => contents.Any(content => content.Id == contentProgress.ContentId)).Where(x => !x.Correct).Count();

                    var coursePerformance = Settings.AppSettings.Grading.GetComputedValue(new string[]
                    {
                        "Poor",
                        "Average",
                        "Good",
                        "Excellent",
                    }, contentsCorrectCount, contentsCount);


                    return new CourseDetailsModel
                    {
                        Id = course.Id,
                        Priority = course.Priority,
                        Title = course.Title,
                        Description = course.Description,
                        CreatedOn = course.CreatedOn,
                        UpdatedOn = course.UpdatedOn,
                        Published = course.Published,
                        Fee = course.Fee,
                        FeePaid = coursePayment != null,
                        FeePaidInfo = CourseDetailsModel.PaymentModel.Map(coursePayment),

                        ImageId = course.ImageId,
                        Image = course.Image != null ? CourseDetailsModel.AssetModel.Map(course.Image, fileClient.GetFileUrl(course.Image.FileName)) : null,

                        CertificateTemplateId = course.CertificateTemplateId,
                        CertificateTemplate = (course.CertificateTemplate != null ? CourseDetailsModel.AssetModel.Map(course.CertificateTemplate, fileClient.GetFileUrl(course.CertificateTemplate.FileName)) : null),

                        Certificated = course.CertificateTemplate != null,

                        CertificateId = courseCertificate?.Id,
                        Certificate = courseCertificate != null ? CourseDetailsModel.CertificateModel.Map(courseCertificate, fileClient.GetFileUrl(courseCertificate.FileName)) : null,

                        Sections = sections,

                        Duration = contentsDuration,

                        StartedOn = courseStartedOn,
                        CompletedOn = courseCompletedOn,
                        LearnersCount = learnersCount,
                        Progress = courseProgress,
                        Status = courseStatus,
                        Performance = coursePerformance,

                        CorrectCount = contentsCorrectCount,
                        WrongCount = contentsWrongCount,
                        ContentsCount = contentsCount,
                    };
                }

                result = (await courses.SelectAsync(selector)).ToList();
                httpContext.Items[cacheKey] = result;
            }

            return result;
        }

        public static async Task<Result> GetCourseDataAsync(IServiceProvider services, User user, CourseSearchModel model)
        {
            if (model == null)
                throw new ArgumentNullException(nameof(model));

            var userManager = services.GetRequiredService<UserManager<User>>();
            var dbContext = services.GetRequiredService<AppDbContext>();
            var fileClient = services.GetRequiredService<IFileClient>();
            var courses = await ServiceHelper.GetCourseDetailsListAsync(services, user);

            if (model.CourseId != null && model.SectionId != null && model.LessonId != null && model.ContentId != null)
            {
                var content = courses.FirstOrDefault(course => course.Id == model.CourseId)?.Sections
                                    .FirstOrDefault(section => section.Id == model.SectionId)?.Lessons
                                    .FirstOrDefault(lesson => lesson.Id == model.LessonId)?.Contents
                                    .FirstOrDefault(content => content.Id == model.ContentId);

                if (content == null)
                    return null;

                var sourceContent = await dbContext.Set<Content>()
                    .OrderBy(x => x.Priority == 0).ThenBy(x => x.Priority)
                    .Include(x => x.QuestionAnswers.OrderBy(x => x.Priority == 0).ThenBy(x => x.Priority))
                    .Include(x => x.Media).FirstOrDefaultAsync(x => x.Id == model.ContentId);

                var data = TypeMerger.Merge(TypeMerger.Merge(new
                {
                    Media = sourceContent.Media != null ? TypeMerger.Merge(new { FileUrl = fileClient.GetFileUrl(sourceContent.Media.FileName) }, sourceContent.Media) : null,
                    QuestionAnswers = sourceContent.QuestionAnswers.Select(questionAnswer => TypeMerger.Ignore(() => questionAnswer.Content).Merge(new { }, questionAnswer))
                }, sourceContent), content);

                if (data == null)
                    return Result.Failed(StatusCodes.Status404NotFound);

                return Result.Succeed(data: data);
            }

            if (model.CourseId != null && model.SectionId != null && model.LessonId != null)
            {
                var data = courses.FirstOrDefault(course => course.Id == model.CourseId)?.Sections
                                    .FirstOrDefault(section => section.Id == model.SectionId)?.Lessons
                                    .FirstOrDefault(lesson => lesson.Id == model.LessonId);

                if (data == null)
                    return Result.Failed(StatusCodes.Status404NotFound);

                return Result.Succeed(data: data);

            }

            if (model.CourseId != null && model.SectionId != null)
            {
                var data = courses.FirstOrDefault(course => course.Id == model.CourseId)?.Sections
                                     .FirstOrDefault(section => section.Id == model.SectionId);

                if (data == null)
                    return Result.Failed(StatusCodes.Status404NotFound);

                return Result.Succeed(data: data);
            }

            if (model.CourseId != null)
            {
                var data = courses.FirstOrDefault(course => course.Id == model.CourseId);

                if (data == null)
                    return Result.Failed(StatusCodes.Status404NotFound);

                return Result.Succeed(data: data);
            }

            return Result.Succeed(data: courses);
        }
    }
}