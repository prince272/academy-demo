using Academy.Clients.FileClient;
using Academy.Entities;
using Academy.Utilities;
using Academy.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace Academy.Web.Controllers
{
    [Route("api/assets")]
    [ApiController]
    public class AssetController : ControllerBase
    {
        private readonly AssetService assetService;

        public AssetController(IServiceProvider services)
        {
            assetService = services.GetRequiredService<AssetService>();
        }

        [HttpPost("upload")]
        [Authorize]
        public async Task<IActionResult> Upload()
        {
            var fileName = ComputeHelper.GenerateSafeFileName(Request.Headers["Upload-Name"].ToString());
            var fileSize = Request.Headers["Upload-Size"].ToString().Parse<long>();
            var fileExtension = Path.GetExtension(fileName);

            var acceptedFileExtensions = new List<string>();

            acceptedFileExtensions.AddRange(assetService.Options.AllFileExtensions.Intersect(Request.Headers.GetCommaSeparatedValues("Upload-Extension"), StringComparer.InvariantCultureIgnoreCase));

            if (!acceptedFileExtensions.Any())
                acceptedFileExtensions.AddRange(Request.Headers.GetCommaSeparatedValues("Upload-Type").Select(x => x.Parse<FileType>()).SelectMany(x => assetService.Options.GetFileExtensions(x)));

            acceptedFileExtensions = acceptedFileExtensions.Distinct().ToList();

            var fileType = acceptedFileExtensions.Contains(fileExtension, StringComparer.InvariantCultureIgnoreCase) ? assetService.Options.GetFileType(fileExtension) : FileType.Unknown;
          
            var asset = new Asset
            {
                FileName = fileName,
                FileSize = fileSize,
                FileType = fileType,
            };

            var result = await assetService.CreateAsync(asset);
            return StatusCode(result.Code, result);
        }

        [HttpPatch("upload/{assetId}")]
        [Authorize]
        public async Task<IActionResult> Upload(long assetId)
        {
            var offset = Request.Headers["Upload-Offset"].ToString().Parse<long>();
            using var stream = (Stream)new MemoryStream(await Request.Body.ReadAllBytesAsync());

            var result = await assetService.UploadAsync(assetId, stream, offset);
            return StatusCode(result.Code, result);
        }

        [HttpPost("delete")]
        [Authorize]
        public async Task<IActionResult> Delete()
        {
            var assetId = (await Request.Body.ReadAllTextAsync()).Parse<long>();
            var result = await assetService.DeleteAsync(assetId);
            return StatusCode(result.Code, result);
        }

        [HttpGet("load/{assetId}")]
        [Authorize]
        public async Task<IActionResult> Load(long assetId)
        {
            var (asset, stream) = await assetService.LoadAsync(assetId);

            if (asset == null || stream == null)
                return StatusCode(StatusCodes.Status404NotFound);

            return File(stream, MimeHelper.GetContentType(asset.FileName), asset.FileName);
        }

        [HttpGet("{assetId}")]
        [Authorize]
        public async Task<IActionResult> Get(long assetId)
        {
            var result = await assetService.GetAsync(assetId);
            return StatusCode(result.Code, result);
        }
    }
}
