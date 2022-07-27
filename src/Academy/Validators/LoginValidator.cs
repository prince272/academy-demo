using Academy.Models;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Validators
{
    public class LoginValidator : AbstractValidator<LoginModel>
    {
        public LoginValidator()
        {
            RuleFor(x => x.Email).NotEmpty().When(x => x.Provider == AccountProvider.Email);
            RuleFor(x => x.PhoneNumber).NotEmpty().When(x => x.Provider == AccountProvider.PhoneNumber);
            RuleFor(x => x.Password).NotEmpty();
        }
    }
}
