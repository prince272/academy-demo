using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Entities
{
    public class Course : IEntity
    {
        public long Id { get; set; }

        public int Priority { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public DateTimeOffset CreatedOn { get; set; }

        public DateTimeOffset UpdatedOn { get; set; }

        public bool Published { get; set; }

        public virtual Asset Image { get; set; }

        public long? ImageId { get; set; }

        public virtual Asset CertificateTemplate { get; set; }

        public long? CertificateTemplateId { get; set; }

        public decimal Fee { get; set; }

        public virtual ICollection<Section> Sections { get; set; } = new List<Section>();
    }
}