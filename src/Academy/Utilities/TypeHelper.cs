using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Utilities
{
    public static class TypeHelper
    {
        public static bool IsPrimitiveType(Type type)
        {
            var typeInfo = type.GetTypeInfo();

            if (typeInfo.IsGenericType && typeInfo.GetGenericTypeDefinition() == typeof(Nullable<>))
            {
                // nullable type, check if the nested type is simple.
                return IsPrimitiveType((typeInfo.GetGenericArguments()[0]));
            }

            return typeInfo.IsPrimitive || typeInfo.IsEnum ||
                   typeInfo == typeof(string) ||
                   typeInfo == typeof(decimal) ||
                   typeInfo == typeof(DateTime) ||
                   typeInfo == typeof(DateTimeOffset) ||
                   typeInfo == typeof(TimeSpan) ||
                   typeInfo == typeof(Guid);
        }
    }
}