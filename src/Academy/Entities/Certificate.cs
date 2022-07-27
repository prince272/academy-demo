using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Entities
{
    public class Certificate : IEntity
    {
        public long Id { get; set; }

        public virtual User User { get; set; }

        public long UserId { get; set; }

        public string Number { get; set; }

        public long CourseId { get; set; }

        public string FileName { get; set; }

        public FileType FileType { get; set; }

        public long FileSize { get; set; }
    }
}
