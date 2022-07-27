using Academy.Clients.FileClient;
using Academy.Data;
using Academy.Entities;
using Academy.Utilities;
using Academy.Services;
using AutoMapper;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Academy.Models;

namespace Academy.Web.Controllers
{
    [Route("api/courses")] 
    [ApiController]
    public class CourseController : ControllerBase
    {
        private readonly CourseService courseService;

        public CourseController(IServiceProvider services)
        {
            courseService = services.GetRequiredService<CourseService>();
        }

        [HttpPost("add")]
        [Authorize(Roles = Constants.AdminRole)]
        public async Task<IActionResult> Add([FromBody] Course model)
        {
            var result = await courseService.AddAsync(model);
            return StatusCode(result.Code, result);
        }

        [HttpPost("edit")]
        [Authorize(Roles = Constants.AdminRole)]
        public async Task<IActionResult> Edit([FromBody] Course model)
        {
            var result = await courseService.EditAsync(model);
            return StatusCode(result.Code, result);
        }

        [HttpPost("delete")]
        [Authorize(Roles = Constants.AdminRole)]
        public async Task<IActionResult> Delete([FromBody] Course model)
        {
            var result = await courseService.DeleteAsync(model);
            return StatusCode(result.Code, result);
        }

        [HttpPost("reorder")]
        [Authorize(Roles = Constants.AdminRole)]
        public async Task<IActionResult> Reorder([FromBody] CourseReorderModel model)
        {
            var result = await courseService.ReorderAsync(model);
            return StatusCode(result.Code, result);
        }

        [HttpGet("populate")]
        public async Task<IActionResult> Populate([FromQuery] CourseSearchModel model)
        {
            var result = await courseService.PopulateAsync(model);
            return StatusCode(result.Code, result);
        }

        [HttpPost("progress")]
        [Authorize]
        public async Task<IActionResult> Progress([FromBody] CourseProgressModel model)
        {
            var result = await courseService.ProgressAsync(model);
            return StatusCode(result.Code, result);
        }

        [HttpPost("export")]
        [Authorize(Roles = Constants.AdminRole)]
        public async Task<IActionResult> Export()
        {
            var result = await courseService.ExportAsync();
            return StatusCode(result.Code, result);
        }

        [HttpPost("import")]
        [Authorize(Roles = Constants.AdminRole)]
        public async Task<IActionResult> Import([FromBody] CourseImportModel model)
        {
            var result = await courseService.ImportAsync(model);
            return StatusCode(result.Code, result);
        }
    }
}