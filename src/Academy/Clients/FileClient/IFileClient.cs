using Academy.Utilities;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Clients.FileClient
{
    public interface IFileClient : IDisposable
    {
        Task WriteFileAsync(string path, Stream stream);

        Task WriteFileAsync(string path, Stream stream, long offset, long length);

        Task DeleteFileAsync(string path);

        Task<Stream> GetFileStreamAsync(string path);

        Task<Stream> GenerateFileStreamAsync(string path);

        string GetFileUrl(string path);
    }
}
