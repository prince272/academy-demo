using Academy.Entities;
using Academy.Services;
using Academy.Utilities;
using FluentValidation;
using Humanizer;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Validators
{
    public class AssetValidator : AbstractValidator<Asset>
    {
        public AssetValidator(IServiceProvider services)
        {
            var assetService = services.GetRequiredService<AssetService>();

            RuleFor(asset => asset.FileType)
                .NotEqual(FileType.Unknown)
                .WithMessage("The file type is not allowed.");

            RuleFor(asset => asset.FileSize)
                .LessThanOrEqualTo((asset) => assetService.Options.GetFileSize(asset.FileType))
                .WithMessage((asset) => $"The file size should not be larger than {assetService.Options.GetFileSize(asset.FileType).Bytes().ToFullWords()}.");
        }
    }
}
