using Academy.Models;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Validators
{
   public class PaymentProcessValidator : AbstractValidator<PaymentProcessModel>
    {
        public PaymentProcessValidator(IServiceProvider services)
        {
        }
    }
}