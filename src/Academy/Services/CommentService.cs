using Academy.Clients.FileClient;
using Academy.Data;
using Academy.Entities;
using Academy.Models;
using Academy.Utilities;
using Academy.Validators;
using Humanizer;
using Humanizer.Localisation;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Services
{
    public class CommentService
    {
        private readonly IServiceProvider _services;
        private readonly AppDbContext dbContext;
        private readonly HttpContext httpContext;
        private readonly UserManager<User> userManager;
        private readonly IFileClient fileClient;

        private const int MAX_COMMENT_PAGE_SIZE = 20;

        public CommentService(IServiceProvider services)
        {
            _services = services;
            dbContext = services.GetRequiredService<AppDbContext>();
            httpContext = services.GetRequiredService<IHttpContextAccessor>().HttpContext;
            userManager = services.GetRequiredService<UserManager<User>>();
            fileClient = services.GetRequiredService<IFileClient>();
        }

        public async Task<Result> AddAsync(Comment model)
        {
            if (model == null)
                throw new ArgumentNullException(nameof(model));

            var result = await ServiceHelper.ValidateAsync<CommentValidator, Comment>(_services, model);
            if (!result.Success)
                return result;

            var comment = new Comment();
            comment = MapComment(model, comment);

            comment.CreatedOn = DateTimeOffset.UtcNow;
            comment.UpdatedOn = DateTimeOffset.UtcNow;
            comment.UserId = (await httpContext.GetCurrentUserAsync()).Id;

            dbContext.Add(comment);
            await dbContext.SaveChangesAsync();

            return Result.Succeed(data: (await GetAsync(new CommentSearchModel { ParentId = comment.ParentId, Id = comment.Id }, multiple: false)).Data);
        }

        public async Task<Result> EditAsync(Comment model)
        {
            if (model == null)
                throw new ArgumentNullException(nameof(model));

            var result = await ServiceHelper.ValidateAsync<CommentValidator, Comment>(_services, model);
            if (!result.Success)
                return result;

            var comment = await GetCommentAsync(model.Id);

            if (comment == null)
                return Result.Failed(StatusCodes.Status404NotFound);

            var currentUser = await httpContext.GetCurrentUserAsync();
            var currentUserIsInAdmin = currentUser != null && await userManager.IsInRoleAsync(currentUser, Constants.AdminRole);

            if (!currentUserIsInAdmin && comment.UserId != currentUser.Id)
                return Result.Failed(StatusCodes.Status403Forbidden);

            comment = MapComment(model, comment);
            comment.UpdatedOn = DateTimeOffset.UtcNow;

            dbContext.Update(comment);
            await dbContext.SaveChangesAsync();

            return Result.Succeed(data: (await GetAsync(new CommentSearchModel { ParentId = comment.ParentId, Id = comment.Id }, multiple: false)).Data);
        }

        public async Task<Result> DeleteAsync(Comment model)
        {
            if (model == null)
                throw new ArgumentNullException(nameof(model));

            var comment = await GetCommentAsync(model.Id);

            if (comment == null)
                return Result.Failed(StatusCodes.Status404NotFound);

            var currentUser = await httpContext.GetCurrentUserAsync();
            var currentUserIsInAdmin = currentUser != null && await userManager.IsInRoleAsync(currentUser, Constants.AdminRole);

            if (!currentUserIsInAdmin && comment.UserId != currentUser.Id)
                return Result.Failed(StatusCodes.Status403Forbidden);

            dbContext.Remove(comment);
            await dbContext.SaveChangesAsync();

            return Result.Succeed(data: new { comment.ParentId, comment.Id });
        }

        public async Task<Result> GetAsync(CommentSearchModel search, bool multiple)
        {
            var currentUser = await httpContext.GetCurrentUserAsync();
            var currentUserIsInAdmin = currentUser != null && await userManager.IsInRoleAsync(currentUser, Constants.AdminRole);

            var query = dbContext.Set<Comment>().AsQueryable();

            query = query.Include(x => x.User).ThenInclude(x => x.Avatar);

            if (search.Id != null)
                query = query.Where(x => x.Id == search.Id);
            
            if (search.EntityName != null)
                query = query.Where(x => x.EntityName == search.EntityName);
            
            if (search.EntityId != null)
                query = query.Where(x => x.EntityId == search.EntityId);

            query = query.Where(x => x.ParentId == search.ParentId);

            query = query.OrderByDescending(x => x.CreatedOn);

           async Task<object> selector(Comment comment)
           {
                var repliesCount = await dbContext.Set<Comment>().Where(x => x.ParentId == comment.Id).CountAsync();

                var data = TypeMerger
                    .Ignore(() => comment.User)
                    .Merge(new
                    {
                        User = comment.User != null ? new
                        {
                            comment.User.Id,
                            comment.User.PreferredName,
                            Avatar = comment.User.Avatar != null ? TypeMerger.Merge(new { FileUrl = fileClient.GetFileUrl(comment.User.Avatar.FileName) }, comment.User.Avatar) : null,
                        } : null,
                        RepliesCount = repliesCount
                    }, comment);
                return data;
            }

            if (multiple)
            {
                var page = new Page(search.PageNumber.GetValueOrDefault(1), MAX_COMMENT_PAGE_SIZE, await query.CountAsync());
                var pageItems = await (await query.Subset(page).ToListAsync()).SelectAsync(selector);
                return Result.Succeed(TypeMerger.Merge(new { Items = pageItems }, page));
            }
            else
            {
                var comment = await query.FirstOrDefaultAsync();
                if (comment != null) return Result.Succeed(await selector(comment));

                return Result.Failed(StatusCodes.Status404NotFound);
            }
        }

        private async Task<Comment> GetCommentAsync(long id)
        {
            var comment = await dbContext.Set<Comment>().AsTracking().FirstOrDefaultAsync(x => x.Id == id);
            return comment;
        }

        private Comment MapComment(Comment source, Comment target = null)
        {
            target.Id = source.Id;
            target.Message = source.Message;
            target.EntityName = source.EntityName;
            target.EntityId = source.EntityId;
            target.ParentId = source.ParentId;

            return target;
        }
    }
}
