using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Utilities
{
    public static class StringExtensions
    {

        /// <summary>
        /// Converts a value to a destination type.
        /// </summary>
        /// <param name="value">The value to convert.</param>
        /// <param name="destinationType">The type to convert the value to.</param>
        /// <returns></returns>
        public static object Parse(this string value, Type destinationType)
        {
            var destinationConverter = TypeDescriptor.GetConverter(destinationType);
            var destination = destinationConverter.ConvertFrom(value);
            return destination;
        }

        /// <summary>
        /// Converts a value to a destination type.
        /// </summary>
        /// <typeparam name="T">The type to convert the value to.</typeparam>
        /// <param name="value">The value to convert.</param>
        /// <returns></returns>
        public static T Parse<T>(this string value)
        {
            return (T)Parse(value, typeof(T));
        }
    }
}