using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Clients.ViewClient
{
    public interface IViewClient
    {
        Task<string> RenderViewToStringAsync(string viewName, object model);

        Task<string> RenderViewToStringAsync(string viewName);
    }
}
