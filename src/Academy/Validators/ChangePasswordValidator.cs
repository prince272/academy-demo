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
    public class ChangePasswordValidator : AbstractValidator<ChangePasswordModel>
    {
        public ChangePasswordValidator()
        {
            RuleFor(x => x.CurrentPassword).NotEmpty().Password();
            RuleFor(x => x.NewPassword).NotEmpty().Password().NotEqual(x => x.CurrentPassword);
        }
    }
}
