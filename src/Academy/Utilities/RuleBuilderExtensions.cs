using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Utilities
{
    public static class RuleBuilderExtensions
    {
        public static IRuleBuilderOptions<T, string> Password<T>(this IRuleBuilder<T, string> ruleBuilder)
        {
            // source: https://github.com/deanilvincent/check-password-strength
            var options = ruleBuilder
                .Must((prop, value) => !string.IsNullOrWhiteSpace(value))
                .WithMessage("'{PropertyName}' must have a minimum of 6 characters, at least 1 letter and 1 number:");

            return options;
        }

        public static IRuleBuilderOptions<T, string> PhoneNumber<T>(this IRuleBuilder<T, string> ruleBuilder)
        {
            return ruleBuilder.Must(x => true);
        }

        public static IRuleBuilderOptions<T, string> PreferedName<T>(this IRuleBuilder<T, string> ruleBuilder)
        {
            return ruleBuilder
                .Must((prop, value) => !string.IsNullOrWhiteSpace(value))
                .MinimumLength(6)
                .WithMessage("{PropertyName} can only contain numbers, letters, and underscore.");
        }

        // C# Regular Expression to match letters, numbers and underscore
        // source: https://stackoverflow.com/questions/885860/c-sharp-regular-expression-to-match-letters-numbers-and-underscore/885864
        public static IRuleBuilderOptions<T, string> UserName<T>(this IRuleBuilder<T, string> ruleBuilder)
        {
            return ruleBuilder
                .Must((prop, value) => !string.IsNullOrWhiteSpace(value))
                .MinimumLength(6)
                .Matches(@"^\w+$")
                .WithMessage("{PropertyName} can only contain numbers, letters, and underscore.");
        }
    }
}