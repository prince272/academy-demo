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
    [Route("api/contents")]
    [ApiController]
    public class ContentController : ControllerBase
    {
        private readonly ContentService contentService;

        public ContentController(IServiceProvider services)
        {
            contentService = services.GetRequiredService<ContentService>();
        }

        [HttpPost("add")]
        [Authorize(Roles = Constants.AdminRole)]
        public async Task<IActionResult> Add([FromBody] Content model)
        {
            var result = await contentService.AddAsync(model);
            return StatusCode(result.Code, result);
        }

        [HttpPost("edit")]
        [Authorize(Roles = Constants.AdminRole)]
        public async Task<IActionResult> Edit([FromBody] Content model)
        {
            var result = await contentService.EditAsync(model);
            return StatusCode(result.Code, result);
        }

        [HttpPost("delete")]
        [Authorize(Roles = Constants.AdminRole)]
        public async Task<IActionResult> Delete([FromBody] Content model)
        {
            var result = await contentService.DeleteAsync(model);
            return StatusCode(result.Code, result);
        }
    }
}
