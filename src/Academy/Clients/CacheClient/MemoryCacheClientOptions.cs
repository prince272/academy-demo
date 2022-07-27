using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Clients.CacheClient
{
    public class MemoryCacheClientOptions
    {
        public TimeSpan CacheLifespan { get; set; }
    }
}
