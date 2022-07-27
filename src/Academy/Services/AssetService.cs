using Academy.Clients.FileClient;
using Academy.Data;
using Academy.Entities;
using Academy.Events;
using Academy.Utilities;
using Academy.Validators;
using Humanizer;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Services
{
    public class AssetService
    {
        private readonly IServiceProvider _services;
        private readonly AppDbContext dbContext;
        private readonly IFileClient fileClient;

        public AssetService(IServiceProvider services)
        {
            _services = services;
            dbContext = services.GetRequiredService<AppDbContext>();
            fileClient = services.GetRequiredService<IFileClient>();
            Options = services.GetRequiredService<IOptions<AssetOptions>>().Value;
        }

        public AssetOptions Options { get; }

        public async Task<Result> CreateAsync(Asset asset)
        {
            if (asset == null) throw new ArgumentNullException(nameof(asset));

            var result = await ServiceHelper.ValidateAsync<AssetValidator, Asset>(_services, asset);

            if (!result.Success)
                return result;

            dbContext.Add(asset);
            await dbContext.SaveChangesAsync();

            return Result.Succeed(data: new { Id = asset.Id });
        }

        public async Task<Result> UploadAsync(long assetId, Stream stream, long offset)
        {
            if (stream == null) throw new ArgumentNullException(nameof(stream));

            var asset = await GetAssetAsync(assetId);
            var result = await ServiceHelper.ValidateAsync<AssetValidator, Asset>(_services, asset);

            if (!result.Success)
                return result;

            await fileClient.WriteFileAsync(asset.FileName, stream, offset, asset.FileSize);

            return Result.Succeed(data: new { Id = asset.Id });
        }

        public async Task<Result> DeleteAsync(long assetId)
        {
            var asset = await GetAssetAsync(assetId);

            if (asset == null)
                return Result.Failed(StatusCodes.Status404NotFound);

            dbContext.Remove(asset);
            await dbContext.SaveChangesAsync();
            await fileClient.DeleteFileAsync(asset.FileName);

            return Result.Succeed();
        }

        public async Task<Result> GetAsync(long assetId)
        {
            var query = dbContext.Set<Asset>();
            var asset = await query.FirstOrDefaultAsync(x => x.Id == assetId);

            if (asset == null)
            {
                return Result.Failed(StatusCodes.Status404NotFound);
            }

            return Result.Succeed(data: TypeMerger.Merge(new { FileUrl = fileClient.GetFileUrl(asset.FileName) }, asset));
        }

        private async Task<Asset> GetAssetAsync(long assetId)
        {
            var query = dbContext.Set<Asset>().AsQueryable();

            var asset = await query.FirstOrDefaultAsync(x => x.Id == assetId);

            return asset;
        }

        public async Task<(Asset, Stream)> LoadAsync(long assetId)
        {
            var asset = await GetAssetAsync(assetId);
            if (asset == null) return default;

            var stream = await fileClient.GetFileStreamAsync(asset.FileName);
            return (asset, stream);
        }
    }

    public class AssetOptions
    {
        public string[] ImageFileExtensions { get; set; }

        public string[] VideoFileExtensions { get; set; }

        public string[] AudioFileExtensions { get; set; }

        public string[] DocumentFileExtensions { get; set; }

        public string[] AllFileExtensions => new List<string[]> 
        {
            ImageFileExtensions,
            VideoFileExtensions,
            AudioFileExtensions,
            DocumentFileExtensions
        }.SelectMany(x => x).ToArray();

        public long ImageFileSize { get; set; }

        public long VideoFileSize { get; set; }

        public long AudioFileSize { get; set; }

        public long DocumentFileSize { get; set; }

        public string[] GetFileExtensions(FileType fileType)
        {
            return fileType switch
            {
                FileType.Image => ImageFileExtensions,
                FileType.Video => VideoFileExtensions,
                FileType.Audio => AudioFileExtensions,
                FileType.Document => DocumentFileExtensions,
                FileType.Unknown => Array.Empty<string>(),
                _ => throw new InvalidOperationException(),
            };
        }

        public long GetFileSize(FileType fileType)
        {
            return fileType switch
            {
                FileType.Image => ImageFileSize,
                FileType.Video => VideoFileSize,
                FileType.Audio => AudioFileSize,
                FileType.Document => DocumentFileSize,
                FileType.Unknown => 0,
                _ => throw new InvalidOperationException(),
            };
        }

        public FileType GetFileType(string fileExtension)
        {
            if (ImageFileExtensions.Contains(fileExtension)) return FileType.Image;
            else if (VideoFileExtensions.Contains(fileExtension)) return FileType.Video;
            else if (AudioFileExtensions.Contains(fileExtension)) return FileType.Audio;
            else if (DocumentFileExtensions.Contains(fileExtension)) return FileType.Document;
            else return FileType.Unknown;
        }
    }
}