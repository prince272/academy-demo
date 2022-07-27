using Academy.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Data.Configurations
{
    public class ContentProgressConfiguration : IEntityTypeConfiguration<ContentProgress>
    {
        public void Configure(EntityTypeBuilder<ContentProgress> builder)
        {
        }
    }
}
