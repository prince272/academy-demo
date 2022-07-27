﻿using Academy.Entities;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Validators
{
    public class SectionValidator : AbstractValidator<Section>
    {
        public SectionValidator()
        {
            RuleFor(x => x.Title).NotEmpty();
        }
    }
}