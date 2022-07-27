using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Academy.Clients.CacheClient
{
    public class MemoryCacheClient : ICacheClient
    {
        private readonly IMemoryCache _cache;
        private readonly MemoryCacheClientOptions _cacheOptions;
        private static CancellationTokenSource _resetCacheToken = new CancellationTokenSource();
        private static readonly ConcurrentDictionary<string, bool> _allCacheKeys;

        static MemoryCacheClient()
        {
            _allCacheKeys = new ConcurrentDictionary<string, bool>();
        }

        public MemoryCacheClient(IServiceProvider services)
        {
            _cache = services.GetRequiredService<IMemoryCache>();
            _cacheOptions = services.GetRequiredService<IOptions<MemoryCacheClientOptions>>().Value;
        }

        public virtual async Task<T> GetAsync<T>(string key, Func<Task<T>> acquire)
        {
            return await _cache.GetOrCreateAsync(key, entry =>
            {
                AddKey(key);
                entry.SetOptions(GetMemoryCacheEntryOptions(_cacheOptions.CacheLifespan));
                return acquire();
            });
        }

        public virtual Task SetAsync(string key, object data, TimeSpan? cacheLifespan = null)
        {
            if (data != null)
            {
                _cache.Set(AddKey(key), data, GetMemoryCacheEntryOptions(cacheLifespan ?? _cacheOptions.CacheLifespan));
            }
            return Task.CompletedTask;
        }

        public virtual Task RemoveAsync(string key)
        {
            _cache.Remove(key);

            return Task.CompletedTask;
        }

        public virtual Task ClearAsync()
        {
            //clear key
            ClearKeys();

            //cancel
            _resetCacheToken.Cancel();
            //dispose
            _resetCacheToken.Dispose();

            _resetCacheToken = new CancellationTokenSource();

            return Task.CompletedTask;
        }

        protected MemoryCacheEntryOptions GetMemoryCacheEntryOptions(TimeSpan cacheLifespan)
        {
            var options = new MemoryCacheEntryOptions() { AbsoluteExpirationRelativeToNow = cacheLifespan }
                .AddExpirationToken(new CancellationChangeToken(_resetCacheToken.Token))
                .RegisterPostEvictionCallback(PostEvictionCallback);

            return options;
        }

        protected string AddKey(string key)
        {
            _allCacheKeys.TryAdd(key, true);
            return key;
        }

        protected string RemoveKey(string key)
        {
            _allCacheKeys.TryRemove(key, out _);
            return key;
        }

        private void ClearKeys()
        {
            _allCacheKeys.Clear();
        }

        private void PostEvictionCallback(object key, object value, EvictionReason reason, object state)
        {
            if (reason == EvictionReason.Replaced)
                return;

            if (reason == EvictionReason.TokenExpired)
                return;

            RemoveKey(key.ToString());
        }

        #region Implements IDisposable

        private bool disposed;

        ~MemoryCacheClient()
        {
            Dispose(disposing: false);
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!disposed)
            {
                if (disposing)
                {
                    _cache.Dispose();
                }

                disposed = true;
            }
        }
        #endregion
    }
}
