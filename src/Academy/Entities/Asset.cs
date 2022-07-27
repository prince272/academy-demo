using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Entities
{
    public class Asset : IEntity
    {
        public long Id { get; set; }

        public FileType FileType { get; set; }

        public string FileName { get; set; }

        public long FileSize { get; set; }
    }

    public enum FileType
    {
        Unknown,
        Image,
        Video,
        Audio,
        Document,
    }
}
