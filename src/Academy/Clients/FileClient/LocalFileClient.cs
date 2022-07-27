using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Clients.FileClient
{
    public class LocalFileClient : IFileClient
    {
        private readonly LocalFileClientOptions fileClientOptions;
        private readonly HttpContext httpContext;
        private readonly ILogger<LocalFileClient> logger;

        public LocalFileClient(IServiceProvider services)
        {
            fileClientOptions = services.GetRequiredService<IOptions<LocalFileClientOptions>>().Value;
            httpContext = services.GetRequiredService<IHttpContextAccessor>().HttpContext;
            logger = services.GetRequiredService<ILogger<LocalFileClient>>();
        }

        public async Task WriteFileAsync(string path, Stream stream, long offset, long length)
        {
            if (path == null)
                throw new ArgumentNullException(nameof(path));

            if (stream == null)
                throw new ArgumentNullException(nameof(stream));

            string tempPath = GetTempPath(path);
            string sourcePath = GetSourcePath(path);

            FileStream tempStream = null;
            long tempStreamLength = 0;

            try
            {
                tempStream = File.Open(tempPath, FileMode.OpenOrCreate, FileAccess.Write);
                tempStream.Seek(offset, SeekOrigin.Begin);
                await stream.CopyToAsync(tempStream);
                tempStreamLength = tempStream.Length;
            }
            finally
            {
                if (tempStream != null)
                    await tempStream.DisposeAsync();
            }

            if (tempStreamLength >= length)
            {
                File.Move(tempPath, sourcePath, false);
            }
        }

        public async Task WriteFileAsync(string path, Stream stream)
        {
            if (path == null)
                throw new ArgumentNullException(nameof(path));

            if (stream == null)
                throw new ArgumentNullException(nameof(stream));

            string sourcePath = GetSourcePath(path);
            using var sourceStream = File.Open(sourcePath, FileMode.OpenOrCreate, FileAccess.Write);
            sourceStream.Seek(sourceStream.Length, SeekOrigin.Begin);
            await stream.CopyToAsync(sourceStream);
        }

        public Task DeleteFileAsync(string path)
        {
            if (path == null)
                throw new ArgumentNullException(nameof(path));

            try
            {
                string tempPath = GetTempPath(path);

                if (File.Exists(tempPath))
                    File.Delete(tempPath);
            }
            catch (Exception ex) {
                logger.LogError("Unable to delete temp file.", ex);
            }

            try
            {
                string sourcePath = GetSourcePath(path);

                if (File.Exists(sourcePath))
                    File.Delete(sourcePath);
            }
            catch (Exception ex) { 
                logger.LogError("Unable to delete source file.", ex); 
            }

            return Task.CompletedTask;
        }

        public Task<Stream> GetFileStreamAsync(string path)
        {
            if (path == null)
                throw new ArgumentNullException(nameof(path));

            string sourcePath = GetSourcePath(path);

            try { return Task.FromResult<Stream>(File.OpenRead(sourcePath)); }
            catch (Exception ex) {
                logger.LogError("Unable to find the file stream.", ex);
                return Task.FromResult<Stream>(null); 
            }
        }

        public Task<Stream> GenerateFileStreamAsync(string path)
        {
            string sourcePath = GetSourcePath(path);
            return Task.FromResult((Stream)File.Open(sourcePath, FileMode.CreateNew));
        }

        public string GetFileUrl(string path)
        {
            if (path == null)
                throw new ArgumentNullException(nameof(path));

            string sourceUrl = $"{httpContext.Request.Scheme}://{httpContext.Request.Host.ToUriComponent()}" +
                             $"/{string.Join('/', fileClientOptions.RootPath.Split(new[] { '/', '\\' }).Skip(1))}" +
                             $"/{path}";

            return sourceUrl;
        }

        private string GetSourcePath(string path)
        {
            string sourcePath = $"{fileClientOptions.RootPath}/{path}".Replace("/", "\\");
            string sourceDirectory = Path.GetDirectoryName(sourcePath);

            if (!Directory.Exists(sourceDirectory))
                Directory.CreateDirectory(sourceDirectory);

            return sourcePath;
        }

        private string GetTempPath(string path)
        {
            string tempPath = GetSourcePath(path) + ".temp";
            return tempPath;
        }

        #region Implements IDisposable

        private bool disposed;

        ~LocalFileClient()
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

                }

                disposed = true;
            }
        }
        #endregion
    }
}
