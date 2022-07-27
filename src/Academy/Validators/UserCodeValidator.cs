using Academy.Entities;
using Academy.Models;
using Academy.Utilities;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Validators
{
    public class UserCodeValidator : AbstractValidator<UserCodeModel>
    {
        public UserCodeValidator(IServiceProvider services)
        {
            RuleFor(_ => _.Email).NotNull().NotEmpty().EmailAddress().MustAsync(async (model, _, cancellation) =>
            {
                var userManager = services.GetRequiredService<UserManager<User>>();
                var taken = !(await userManager.Users.AnyAsync(_ => _.Email == userManager.NormalizeEmail(model.Email)))
                || userManager.NormalizeEmail(model.Email) != userManager.NormalizeEmail(model.CurrentEmail);
                
                return taken;
            })
                .WithMessage("That {PropertyName} is taken. Try another.").When(_ =>
                {
                    var userManager = services.GetRequiredService<UserManager<User>>();
                    return _.Provider == AccountProvider.Email;
                });

            RuleFor(_ => _.PhoneNumber).NotNull().NotEmpty().PhoneNumber().MustAsync(async (model, _, cancellation) =>
            {
                var userManager = services.GetRequiredService<UserManager<User>>();
                var taken = !(await userManager.Users.AnyAsync(_ => _.PhoneNumber == model.PhoneNumber))
                || model.PhoneNumber != model.CurrentPhoneNumber;

                return taken;
            })
                .WithMessage("That {PropertyName} is taken. Try another.").When(_ => _.Provider == AccountProvider.PhoneNumber);

            RuleFor(x => x.Password).NotEmpty().Password().When(x => x.Action == AccountAction.Recover);
        }
    }
}