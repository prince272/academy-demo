using Academy.Entities;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Validators
{
    public class ContentValidator : AbstractValidator<Content>
    {
        public ContentValidator()
        {
            RuleForEach(x => x.QuestionAnswers).SetValidator(new QuestionAnswerValidator());
        }
    }

    public class QuestionAnswerValidator : AbstractValidator<QuestionAnswer>
    {
        public QuestionAnswerValidator()
        {
            RuleFor(x => x.Description).NotEmpty();
        }
    }
}
