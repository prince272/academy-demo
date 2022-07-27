using Academy.Entities;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Validators
{
    public class LessonValidator : AbstractValidator<Lesson>
    {
        public LessonValidator()
        {
            RuleFor(x => x.Title).NotEmpty();
            RuleForEach(x => x.Contents).SetValidator(new ContentValidator());
        }
    }
}
