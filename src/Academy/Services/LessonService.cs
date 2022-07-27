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
    public class LessonService
    {
        private readonly IServiceProvider _services;
        private readonly AppDbContext dbContext;
        private readonly HttpContext httpContext;
        private const int MAX_LESSON_COUNT = 250;

        public LessonService(IServiceProvider services)
        {
            _services = services;
            dbContext = services.GetRequiredService<AppDbContext>();
            httpContext = services.GetRequiredService<IHttpContextAccessor>().HttpContext;
        }

        public async Task<Result> AddAsync(Lesson model)
        {
            if (model == null)
                throw new ArgumentNullException(nameof(model));

            var result = await ServiceHelper.ValidateAsync<LessonValidator, Lesson>(_services, model);
            if (!result.Success)
                return result;

            // Check if maximum number of sections has been reached.
            var lessonCount = await dbContext.Set<Lesson>().Where(x => x.SectionId == model.SectionId).CountAsync();
            if (lessonCount >= MAX_LESSON_COUNT)
                return Result.Failed(StatusCodes.Status400BadRequest, message: "You've reached the maximum number of lessons you can add per each section.");

            var lesson = new Lesson();
            MapLesson(model, lesson);

            dbContext.Add(lesson);
            await dbContext.SaveChangesAsync();

            lesson = await GetLessonAsync(lesson.Id);

            return Result.Succeed(data: (await ServiceHelper.GetCourseDataAsync(_services, await httpContext.GetCurrentUserAsync(), new CourseSearchModel
            {
                CourseId = lesson.Section.Course.Id,
                SectionId = lesson.Section.Id,
                LessonId = lesson.Id
            })).Data);
        }

        public async Task<Result> EditAsync(Lesson model)
        {
            if (model == null)
                throw new ArgumentNullException(nameof(model));

            var result = await ServiceHelper.ValidateAsync<LessonValidator, Lesson>(_services, model);
            if (!result.Success)
                return result;

            var lesson = await GetLessonAsync(model.Id);

            if (lesson == null)
                return Result.Failed(StatusCodes.Status404NotFound);

            MapLesson(model, lesson);

            dbContext.Update(lesson);
            await dbContext.SaveChangesAsync();

            return Result.Succeed(data: (await ServiceHelper.GetCourseDataAsync(_services, await httpContext.GetCurrentUserAsync(), new CourseSearchModel
            {
                CourseId = lesson.Section.Course.Id,
                SectionId = lesson.Section.Id,
                LessonId = lesson.Id
            })).Data);
        }

        public async Task<Result> DeleteAsync(Lesson model)
        {
            if (model == null)
                throw new ArgumentNullException(nameof(model));

            var lesson = await GetLessonAsync(model.Id);

            if (lesson == null)
                return Result.Failed(StatusCodes.Status404NotFound);

            dbContext.Remove(lesson);

            await dbContext.SaveChangesAsync();

            return Result.Succeed(new { Id = lesson.Id });
        }

        private async Task<Lesson> GetLessonAsync(long id)
        {
            var lesson = await dbContext.Set<Lesson>().AsTracking()
                .Include(x => x.Section).ThenInclude(x => x.Course)
                .FirstOrDefaultAsync(x => x.Id == id);
            return lesson;
        }

        private void MapLesson(Lesson source, Lesson target)
        {
            if (target == null) target = new Lesson();

            target.Priority = source.Priority;
            target.Id = source.Id;
            target.Title = source.Title;
            target.SectionId = source.SectionId;
        }
    }
}
