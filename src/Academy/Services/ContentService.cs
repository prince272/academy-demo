using Academy.Data;
using Academy.Entities;
using Academy.Events;
using Academy.Utilities;
using Academy.Validators;
using Humanizer;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Academy.Models;
using Academy.Clients.FileClient;

namespace Academy.Services
{
    public class ContentService
    {
        private readonly IServiceProvider _services;
        private readonly AppDbContext dbContext;
        private readonly HttpContext httpContext;
        private const int MAX_CONTENT_COUNT = 250;

        public ContentService(IServiceProvider services)
        {
            _services = services;
            dbContext = services.GetRequiredService<AppDbContext>(); 
            httpContext = services.GetRequiredService<IHttpContextAccessor>().HttpContext;
        }

        public async Task<Result> AddAsync(Content model)
        {
            if (model == null)
                throw new ArgumentNullException(nameof(model));

            var result = await ServiceHelper.ValidateAsync<ContentValidator, Content>(_services, model);
            if (!result.Success)
                return result;

            // Check if maximum number of sections has been reached.
            var contentCount = await dbContext.Set<Content>().Where(x => x.LessonId == model.LessonId).CountAsync();
            if (contentCount >= MAX_CONTENT_COUNT)
                return Result.Failed(StatusCodes.Status400BadRequest, message: "You've reached the maximum number of contents you can add per each lesson.");

            var content = new Content();
            MapContent(model, content);

            dbContext.Add(content);
            await dbContext.SaveChangesAsync();

            content = await GetContentAsync(content.Id);

            return Result.Succeed(data: (await ServiceHelper.GetCourseDataAsync(_services, await httpContext.GetCurrentUserAsync(), new CourseSearchModel
            {
                CourseId = content.Lesson.Section.Course.Id,
                SectionId = content.Lesson.Section.Id,
                LessonId = content.Lesson.Id,
                ContentId = content.Id
            })).Data);
        }

        public async Task<Result> EditAsync(Content model)
        {
            if (model == null)
                throw new ArgumentNullException(nameof(model));

            var result = await ServiceHelper.ValidateAsync<ContentValidator, Content>(_services, model);
            if (!result.Success)
                return result;

            var content = await GetContentAsync(model.Id);

            if (content == null)
                return Result.Failed(StatusCodes.Status404NotFound);

            MapContent(model, content);

            dbContext.Update(content);
            await dbContext.SaveChangesAsync();

            return Result.Succeed(data: (await ServiceHelper.GetCourseDataAsync(_services, await httpContext.GetCurrentUserAsync(), new CourseSearchModel
            {
                CourseId = content.Lesson.Section.Course.Id,
                SectionId = content.Lesson.Section.Id,
                LessonId = content.Lesson.Id,
                ContentId = content.Id
            })).Data);
        }

        public async Task<Result> DeleteAsync(Content model)
        {
            if (model == null)
                throw new ArgumentNullException(nameof(model));

            var content = await GetContentAsync(model.Id);

            if (content == null)
                return Result.Failed(StatusCodes.Status404NotFound);

            dbContext.Remove(content);

            await dbContext.SaveChangesAsync();

            return Result.Succeed(new { Id = content.Id });
        }

        private async Task<Content> GetContentAsync(long id)
        {
            var content = await dbContext.Set<Content>().AsTracking()
                         .OrderBy(x => x.Priority == 0).ThenBy(x => x.Priority)
                         .Include(x => x.Lesson).ThenInclude(x => x.Section).ThenInclude(x => x.Course)
                         .Include(x => x.QuestionAnswers.OrderBy(x => x.Priority == 0).ThenBy(x => x.Priority))
                         .Include(x => x.Media).FirstOrDefaultAsync(x => x.Id == id);
            return content;
        }

        private void MapContent(Content source, Content target)
        {
            target.LessonId = source.LessonId;
            target.MediaId = source.MediaId;
            target.Priority = source.Priority;
            target.Id = source.Id;
            target.Explanation = source.Explanation;
            target.Question = source.Question;
            target.QuestionType = source.QuestionType;
            target.QuestionAnswers = source.QuestionAnswers.Select(sourceQuestion => new QuestionAnswer
            {
                Priority = sourceQuestion.Priority,
                Id = sourceQuestion.Id,
                Description = sourceQuestion.Description,
                Correct = sourceQuestion.Correct,
                ContentId = sourceQuestion.ContentId
            }).ToList();
            target.Duration = source.Duration;
        }
    }
}
