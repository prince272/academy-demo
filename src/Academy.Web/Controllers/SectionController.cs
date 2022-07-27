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
    [Route("api/sections")]
    [ApiController]
    public class SectionController : ControllerBase
    {
        private readonly SectionService sectionService;

        public SectionController(IServiceProvider services)
        {
            sectionService = services.GetRequiredService<SectionService>();
        }

        [HttpPost("add")]
        [Authorize(Roles = Constants.AdminRole)]
        public async Task<IActionResult> Add([FromBody] Section model)
        {
            var result = await sectionService.AddAsync(model);
            return StatusCode(result.Code, result);
        }

        [HttpPost("edit")]
        [Authorize(Roles = Constants.AdminRole)]
        public async Task<IActionResult> Edit([FromBody] Section model)
        {
            var result = await sectionService.EditAsync(model);
            return StatusCode(result.Code, result);
        }

        [HttpPost("delete")]
        [Authorize(Roles = Constants.AdminRole)]
        public async Task<IActionResult> Delete([FromBody] Section model)
        {
            var result = await sectionService.DeleteAsync(model);
            return StatusCode(result.Code, result);
        }
    }
}
