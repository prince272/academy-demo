using Academy.Entities;
using Academy.Models;
using Academy.Services;
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
    [Route("api/comments")]
    [ApiController]
    public class CommentController : ControllerBase
    {
        private readonly CommentService commentService;

        public CommentController(IServiceProvider services)
        {
            commentService = services.GetRequiredService<CommentService>();
        }

        [HttpPost("add")]
        public async Task<IActionResult> Add([FromBody] Comment model)
        {
            var result = await commentService.AddAsync(model);
            return StatusCode(result.Code, result);
        }

        [HttpPost("edit")]
        public async Task<IActionResult> Edit([FromBody] Comment model)
        {
            var result = await commentService.EditAsync(model);
            return StatusCode(result.Code, result);
        }

        [HttpPost("delete")]
        public async Task<IActionResult> Delete([FromBody] Comment model)
        {
            var result = await commentService.DeleteAsync(model);
            return StatusCode(result.Code, result);
        }

        [HttpGet("{commentId}")]
        public async Task<IActionResult> GetComment(long commentId)
        {
            var result = await commentService.GetAsync(new CommentSearchModel { Id = commentId }, multiple: false);
            return StatusCode(result.Code, result);
        }

        [HttpGet()]
        public async Task<IActionResult> GetComments([FromQuery] CommentSearchModel model)
        {
            var result = await commentService.GetAsync(model, multiple: true);
            return StatusCode(result.Code, result);
        }
    }
}
