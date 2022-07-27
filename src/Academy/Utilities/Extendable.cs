using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Utilities
{
    public static class ExtendableExtensions
    {
        public static T GetData<T>(this IExtendable extendable, string name, bool handleType = false)
        {
            return extendable.GetData<T>(
                name,
                handleType
                    ? new JsonSerializer { TypeNameHandling = TypeNameHandling.All }
                    : JsonSerializer.CreateDefault()
            );
        }

        public static T GetData<T>(this IExtendable extendable, string name, JsonSerializer jsonSerializer)
        {
            if (extendable == null) throw new ArgumentNullException(nameof(extendable));
            if (name == null) throw new ArgumentNullException(nameof(name));

            if (extendable.ExtensionData == null)
            {
                return default(T);
            }

            var json = JObject.Parse(extendable.ExtensionData);

            var prop = json[name];
            if (prop == null)
            {
                return default(T);
            }

            if (TypeHelper.IsPrimitiveType(typeof(T)))
            {
                return prop.Value<T>();
            }
            else
            {
                return (T)prop.ToObject(typeof(T), jsonSerializer ?? JsonSerializer.CreateDefault());
            }
        }

        public static void SetData<T>(this IExtendable extendable, string name, T value, bool handleType = false)
        {
            extendable.SetData(
                name,
                value,
                handleType
                    ? new JsonSerializer { TypeNameHandling = TypeNameHandling.All }
                    : JsonSerializer.CreateDefault()
            );
        }

        public static void SetData<T>(this IExtendable extendable, string name, T value, JsonSerializer jsonSerializer)
        {
            if (extendable == null) throw new ArgumentNullException(nameof(extendable));
            if (name == null) throw new ArgumentNullException(nameof(name));

            if (jsonSerializer == null)
            {
                jsonSerializer = JsonSerializer.CreateDefault();
            }

            if (extendable.ExtensionData == null)
            {
                if (EqualityComparer<T>.Default.Equals(value, default(T)))
                {
                    return;
                }

                extendable.ExtensionData = "{}";
            }

            var json = JObject.Parse(extendable.ExtensionData);

            if (value == null || EqualityComparer<T>.Default.Equals(value, default(T)))
            {
                if (json[name] != null)
                {
                    json.Remove(name);
                }
            }
            else if (TypeHelper.IsPrimitiveType(value.GetType()))
            {
                json[name] = new JValue(value);
            }
            else
            {
                json[name] = JToken.FromObject(value, jsonSerializer);
            }

            var data = json.ToString(Formatting.None);
            if (data == "{}")
            {
                data = null;
            }

            extendable.ExtensionData = data;
        }

        public static bool RemoveData(this IExtendable extendable, string name)
        {
            if (extendable == null) throw new ArgumentNullException(nameof(extendable));
            if (name == null) throw new ArgumentNullException(nameof(name));

            if (extendable.ExtensionData == null)
            {
                return false;
            }

            var json = JObject.Parse(extendable.ExtensionData);

            var token = json[name];
            if (token == null)
            {
                return false;
            }

            json.Remove(name);

            var data = json.ToString(Formatting.None);
            if (data == "{}")
            {
                data = null;
            }

            extendable.ExtensionData = data;

            return true;
        }
    }

    public interface IExtendable
    {
        string ExtensionData { get; set; }
    }
}