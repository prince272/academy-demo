using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Utilities
{
    public class Result
    {
        public Result(int code, ResultAction? action, string message, object data, IDictionary<string, string> errors)
        {
            Success = code == StatusCodes.Status200OK;
            Code = code;
            Action = action;
            Message = message;
            Data = data;
            Errors = errors ?? new Dictionary<string, string>();
        }

        public int Code { get; set; }

        public bool Success { get; set; }

        public string Message { get; set; }

        public object Data { get; set; }

        public ResultAction? Action { get; set; }

        public IDictionary<string, string> Errors { get; set; }

        public static Result Succeed(object data = null, ResultAction? action = null)
        {
            return new Result(StatusCodes.Status200OK, action, null, data, null);
        }

        public static Result Failed(int code, ResultAction? action = null, string message = null, IDictionary<string, string> errors = null)
        {
            return new Result(code, action, message, null, errors);
        }

        public static Result Failed(IdentityResult identityResult)
        {
            // Throw if the identity result had succeed and it's been returned as a failed result.
            if (identityResult.Succeeded)
                throw new InvalidOperationException();

            var messages = new List<string>();

            foreach (var identityError in identityResult.Errors)
            {

                switch (identityError.Code)
                {
                    case "DuplicateEmail":
                        messages.Add("Email is already taken.");
                        break;

                    case "InvalidEmail":
                        messages.Add("Email is invalid.");
                        break;

                    case "InvalidToken":
                        messages.Add("Security code is invalid.");
                        break;

                    default:
                        messages.Add(identityError.Description);
                        break;
                }
            }

            return Failed(StatusCodes.Status400BadRequest, message: messages.First());
        }

        public static Result Failed(SignInResult loginResult)
        {
            // Throw if the identity result had succeed and it's been returned as a failed result.
            if (loginResult.Succeeded)
                throw new InvalidOperationException();

            if (loginResult.RequiresTwoFactor)
                return Failed(StatusCodes.Status403Forbidden, message: "Your account requires 2-step authentication.");

            else if (loginResult.IsLockedOut)
                return Failed(StatusCodes.Status403Forbidden, message: "You account has been locked.");

            else if (loginResult.IsNotAllowed)
            {
                return Failed(StatusCodes.Status403Forbidden, message: "Your account is not allowed to login.");
            }
            else
                return Failed(StatusCodes.Status401Unauthorized, message: "Wrong password. Try again or click Forgot password to reset it.");
        }
    }

    public enum ResultAction
    {
        Confirm
    }
}