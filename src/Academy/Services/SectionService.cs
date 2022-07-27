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

namespace Academy.Services
{
    public class SectionService
    {
        private readonly IServiceProvider _services;
        private readonly AppDbContext dbContext;
        private readonly HttpContext httpContext;
        private const int MAX_SECTION_COUNT = 250;

        public SectionService(IServiceProvider services)
        {
            _services = services;
            dbContext = services.GetRequiredService<AppDbContext>();
            httpContext = services.GetRequiredService<IHttpContextAccessor>().HttpContext;
        }

        public async Task<Result> AddAsync(Section model)
        {
            if (model == null)
                throw new ArgumentNullException(nameof(model));

            var result = await ServiceHelper.ValidateAsync<SectionValidator, Section>(_services, model);
            if (!result.Success)
                return result;

            // Check if maximum number of sections has been reached.
            var sectionCount = await dbContext.Set<Section>().Where(x => x.CourseId == model.CourseId).CountAsync();
            if (sectionCount >= MAX_SECTION_COUNT)
                return Result.Failed(StatusCodes.Status400BadRequest, message: "You've reached the maximum number of sections you can add per each course.");


            var section = new Section();
            MapSection(model, section);

            dbContext.Add(section);
            await dbContext.SaveChangesAsync();

            section = await GetSectionAsync(section.Id);

            return Result.Succeed(data: (await ServiceHelper.GetCourseDataAsync(_services, await httpContext.GetCurrentUserAsync(), new CourseSearchModel
            {
                CourseId = section.Course.Id,
                SectionId = section.Id
            })).Data);
        }

        public async Task<Result> EditAsync(Section model)
        {
            if (model == null)
                throw new ArgumentNullException(nameof(model));

            var result = await ServiceHelper.ValidateAsync<SectionValidator, Section>(_services, model);
            if (!result.Success)
                return result;

            var section = await GetSectionAsync(model.Id);

            if (section == null)
                return Result.Failed(StatusCodes.Status404NotFound);

            MapSection(model, section);

            dbContext.Update(section);
            await dbContext.SaveChangesAsync();

            return Result.Succeed(data: (await ServiceHelper.GetCourseDataAsync(_services, await httpContext.GetCurrentUserAsync(), new CourseSearchModel
            {
                CourseId = section.Course.Id,
                SectionId = section.Id
            })).Data);
        }

        public async Task<Result> DeleteAsync(Section model)
        {
            if (model == null)
                throw new ArgumentNullException(nameof(model));

            var section = await GetSectionAsync(model.Id);

            if (section == null)
                return Result.Failed(StatusCodes.Status404NotFound);

            dbContext.Remove(section);

            await dbContext.SaveChangesAsync();

            return Result.Succeed(new { Id = section.Id });
        }

        private async Task<Section> GetSectionAsync(long id)
        {
            var section = await dbContext.Set<Section>().AsTracking()
                         .Include(x => x.Course)
                         .FirstOrDefaultAsync(x => x.Id == id);

            return section;
        }

        private void MapSection(Section source, Section target)
        {
            target.Priority = source.Priority;
            target.Id = source.Id;
            target.Title = source.Title;
            target.CourseId = source.CourseId;
        }
    }
}
