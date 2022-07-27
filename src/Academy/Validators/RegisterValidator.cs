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
    public class RegisterValidator : AbstractValidator<RegisterModel>
    {
        public RegisterValidator(IServiceProvider services)
        {
            RuleFor(_ => _.Email).NotNull().NotEmpty().EmailAddress().MustAsync(async (model, _, cancellation) =>
            {
                var userManager = services.GetRequiredService<UserManager<User>>();
                var exists = await userManager.Users.AnyAsync(_ => _.Email == userManager.NormalizeEmail(model.Email));
                return !exists;
            })
                .WithMessage("That {PropertyName} is taken. Try another.").When(_ => _.Provider == AccountProvider.Email);

            RuleFor(_ => _.PhoneNumber).NotNull().NotEmpty().PhoneNumber().MustAsync(async (model, _, cancellation) =>
            {
                var userManager = services.GetRequiredService<UserManager<User>>();
                var exists = await userManager.Users.AnyAsync(_ => _.PhoneNumber == model.PhoneNumber);
                return !exists;
            })
                .WithMessage("That {PropertyName} is taken. Try another.").When(_ => _.Provider == AccountProvider.PhoneNumber);

            RuleFor(x => x.PreferredName).NotNull().NotEmpty();
            RuleFor(x => x.Password).NotEmpty().Password();
            RuleFor(x => x.Agreed).Equal(true).WithMessage("Please agree to register.");
        }
    }
}