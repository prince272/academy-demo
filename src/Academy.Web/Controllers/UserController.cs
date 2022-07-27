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
    [Route("api/users")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly UserService userService;

        public UserController(IServiceProvider services)
        {
            userService = services.GetRequiredService<UserService>();
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterModel model)
        {
            var result = await userService.RegisterAsync(model);
            return StatusCode(result.Code, result);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginModel model)
        {
            var result = await userService.LoginAsync(model);
            return StatusCode(result.Code, result);
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var result = await userService.LogoutAsync();
            return StatusCode(result.Code, result);
        }

        [HttpPost("code/send")]
        public async Task<IActionResult> SendCode(UserCodeModel model)
        {
            var result = await userService.SendCodeAsync(model);
            return StatusCode(result.Code, result);
        }

        [HttpPost("code/receive")]
        public async Task<IActionResult> ReceiveCode(UserCodeModel model)
        {
            var result = await userService.ReceiveCodeAsync(model);
            return StatusCode(result.Code, result);
        }


        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUser(long userId)
        {
            var result = await userService.GetSingleOrMultipleUserAsync(new UserSearchModel { Id = userId }, multiple: false);
            return StatusCode(result.Code, result);
        }

        [HttpGet()]
        public async Task<IActionResult> GetUsers([FromQuery] UserSearchModel model)
        {
            var result = await userService.GetSingleOrMultipleUserAsync(model, multiple: true);
            return StatusCode(result.Code, result);
        }

        [HttpPost("current/edit")]
        [Authorize]
        public async Task<IActionResult> EditCurrentUser(UserEditModel model)
        {
            var result = await userService.EditCurrentUserAsync(model);
            return StatusCode(result.Code, result);
        }

        [HttpGet("current")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            var result = await userService.GetCurrentUserAsync();
            return StatusCode(result.Code, result);
        }

        [HttpPost("password/change")]
        [Authorize]
        public async Task<IActionResult> ChangePassword(ChangePasswordModel model)
        {
            var result = await userService.ChangePasswordAsync(model);
            return StatusCode(result.Code, result);
        }

        [HttpPost("payment/process")]
        [Authorize]
        public async Task<IActionResult> ProcessPayment(PaymentProcessModel model)
        {
            var result = await userService.ProcessPaymentAsync(model);
            return StatusCode(result.Code, result);
        }

        [HttpPost("payment/verify")]
        [Authorize]
        public async Task<IActionResult> VerifyPayment(PaymentVerifyModel model)
        {
            var result = await userService.VerifyPaymentAsync(model);
            return StatusCode(result.Code, result);
        }


        [HttpPost("{userId}/follow")]
        public async Task<IActionResult> Follow(long userId)
        {
            var result = await userService.FollowUserAsync(userId, true);
            return StatusCode(result.Code, result);
        }

        [HttpPost("{userId}/unfollow")]
        public async Task<IActionResult> Unfollow(long userId)
        {
            var result = await userService.FollowUserAsync(userId, false);
            return StatusCode(result.Code, result);
        }
    }
}
