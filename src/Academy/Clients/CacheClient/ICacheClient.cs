using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Clients.CacheClient
{
    public interface ICacheClient : IDisposable
    {
        Task<T> GetAsync<T>(string key, Func<Task<T>> acquire);

        Task RemoveAsync(string key);

        Task ClearAsync();
    }
}
