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
    public class ContentConfiguration : IEntityTypeConfiguration<Content>
    {
        public void Configure(EntityTypeBuilder<Content> builder)
        {
        }
    }

    public class QuestionAnswerConfiguration : IEntityTypeConfiguration<QuestionAnswer>
    {

        public void Configure(EntityTypeBuilder<QuestionAnswer> builder)
        {
        }
    }
}
