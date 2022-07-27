using Academy.Models;
using Academy.Utilities;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Validators
{
    public class UserEditValidator : AbstractValidator<UserEditModel>
    {
        public UserEditValidator()
        {
            RuleFor(x => x.PreferredName).NotEmpty().PreferedName();
            RuleFor(x => x.UserName).NotEmpty().UserName();
        }
    }
}
