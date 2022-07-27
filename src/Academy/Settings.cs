using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy
{
    public static class Settings
    {
        private static AppSettings _appSettings;
        public static AppSettings AppSettings => _appSettings ??= AppSettingsFunc();
        public static Func<AppSettings> AppSettingsFunc { get; set; }


        private static JsonSerializerSettings _serializerSettings;
        public static JsonSerializerSettings SerializerSettings => _serializerSettings ??= SerializerSettingsFunc();
        public static Func<JsonSerializerSettings> SerializerSettingsFunc { get; set; }
    }

    public class AppSettings
    {
        public CultureOptions Culture { get; set; }

        public GradingOptions Grading { get; set; }

        public class GradingOptions
        {
            public List<Grade> Data { get; set; }

            public int Points { get; set; }

            public TValue GetComputedValue<TValue>(TValue[] values, int initialPoints, int expectedPoints)
            {
                var estimatedValueIndex = (int)Math.Round((expectedPoints != 0 ? (initialPoints / (decimal)expectedPoints) : 0) * values.Count(), MidpointRounding.AwayFromZero);

                // How to get the closest number from a List<int> with LINQ?
                // source: https://stackoverflow.com/questions/5953552/how-to-get-the-closest-number-from-a-listint-with-linq/41082314
                var closestItem = values.Select((value, index) => new { Value = value, Index = index })
                    .OrderBy(item => Math.Abs(estimatedValueIndex - item.Index)).First();

                return closestItem.Value;
            }
        }

        public class Grade
        {
            public GradeMedal Medal { get; set; }

            public int[] Points { get; set; }
        }

        public enum GradeMedal
        {
            None,
            Bronze,
            Silver,
            Gold,
            Platinum
        }

        public enum GradePerformace
        {
            Poor,
            Average,
            Good,
            Excellent
        }

        public class CultureOptions
        {
            public string CurrencySymbol { get; set; }

            public string CurrencyName { get; set; }

            public string CountryName { get; set; }

            public string CountryCode { get; set; }
        }
    }
}
