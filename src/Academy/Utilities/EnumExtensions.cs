using Humanizer;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Utilities
{
    public static class EnumExtensions
    {
        public static TAttribute GetAttributeFromEnum<TEnum, TAttribute>(this TEnum enumValue)
            where TAttribute : Attribute
            where TEnum : struct, Enum
        {
            var enumType = enumValue.GetType();
            var enumMember = enumType.GetMember(enumValue.ToString()).FirstOrDefault();
            var enumAttribute = enumMember != null ? AttributeHelper.GetMemberAttribute<TAttribute>(enumMember) : null;

            if (enumAttribute != null)
            {
                return enumAttribute;
            }

            return null;
        }

        public static string GetDisplayName<TEnum>(this TEnum enumValue)
            where TEnum : struct, Enum
        {
            var displayAttribute = GetAttributeFromEnum<TEnum, DisplayAttribute>(enumValue);
            if (displayAttribute != null && displayAttribute.Name != null)
            {
                return displayAttribute.Name;
            }

            if (Enum.IsDefined(typeof(TEnum), enumValue))
                return enumValue.ToString().Humanize(LetterCasing.Sentence);
            else
                return "N/A";
        }

        public static object GetNumericValue<TEnum>(this TEnum enumValue)
            where TEnum : struct, Enum
        {
            return Convert.ChangeType(enumValue, Type.GetTypeCode(enumValue.GetType()));
        }

        public static TEnum MergeEnums<TEnum>(this IEnumerable<TEnum> enumValues)
            where TEnum : struct, Enum
        {
            if (enumValues == null)
                throw new ArgumentNullException(nameof(enumValues));

            return (TEnum)(object)enumValues.Cast<int>().Aggregate(0, (c, n) => c |= n);
        }

        public static IEnumerable<TEnum> ExpandEnum<TEnum>(this TEnum enumValue)
            where TEnum : struct, Enum
        {
            var enumType = enumValue.GetType();

            var flags = Enum.GetValues(enumValue.GetType())
                .Cast<Enum>().Where(x => enumValue.HasFlag(x));

            return flags.Cast<TEnum>();
        }
    }
}
