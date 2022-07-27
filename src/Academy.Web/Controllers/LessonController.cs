using Academy.Entities;
using Academy.Models;
using Academy.Services;
using Academy.Utilities;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Academy.Web.Controllers
{
    [Route("api/lessons")]
    [ApiController]
    public class LessonController : ControllerBase
    {
        private readonly LessonService lessonService;

        public LessonController(IServiceProvider services)
        {
            lessonService = services.GetRequiredService<LessonService>();
        }

        [HttpPost("add")]
        [Authorize(Roles = Constants.AdminRole)]
        public async Task<IActionResult> Add([FromBody] Lesson model)
        {
            var result = await lessonService.AddAsync(model);
            return StatusCode(result.Code, result);
        }

        [HttpPost("edit")]
        [Authorize(Roles = Constants.AdminRole)]
        public async Task<IActionResult> Edit([FromBody] Lesson model)
        {
            var result = await lessonService.EditAsync(model);
            return StatusCode(result.Code, result);
        }

        [HttpPost("delete")]
        [Authorize(Roles = Constants.AdminRole)]
        public async Task<IActionResult> Delete([FromBody] Lesson model)
        {
            var result = await lessonService.DeleteAsync(model);
            return StatusCode(result.Code, result);
        }
    }
}
