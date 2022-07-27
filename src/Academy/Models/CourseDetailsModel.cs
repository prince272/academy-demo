using Academy.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academy.Models
{
    public class CourseDetailsModel
    {
        public long Id { get; set; }

        public int Priority { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public DateTimeOffset CreatedOn { get; set; }

        public DateTimeOffset UpdatedOn { get; set; }

        public DateTimeOffset? StartedOn { get; set; }

        public DateTimeOffset? CompletedOn { get; set; }

        public bool Published { get; set; }

        public virtual AssetModel Image { get; set; }

        public long? ImageId { get; set; }

        public virtual AssetModel CertificateTemplate { get; set; }

        public long? CertificateTemplateId { get; set; }

        public bool Certificated { get; set; }

        public decimal Fee { get; set; }

        public bool FeePaid { get; set; }

        public long? CertificateId { get; set; }

        public virtual CertificateModel Certificate { get; set; }

        public long LearnersCount { get; set; }

        public long CommentsCount { get; set; }

        public virtual ICollection<SectionModel> Sections { get; set; } = new List<SectionModel>();


        public decimal Progress { get; set; }

        public ContentStatus Status { get; set; }

        public double Duration { get; set; }

        public string Performance { get; set; }

        public PaymentModel FeePaidInfo { get; set; }


        public int ContentsCount { get; set; }

        public int WrongCount { get; set; }

        public int CorrectCount { get; set; }

        public class AssetModel
        {
            public long Id { get; set; }

            public string FileName { get; set; }

            public FileType FileType { get; set; }

            public long FileSize { get; set; }

            public string FileUrl { get; set; }

            public static AssetModel Map(Asset asset, string fileUrl)
            {
                if (asset == null) return null;

                return new AssetModel
                {
                    Id = asset.Id,
                    FileName = asset.FileName,
                    FileType = asset.FileType,
                    FileSize = asset.FileSize,
                    FileUrl = fileUrl,
                };
            }
        }

        public class CertificateModel
        {
            public long Id { get; set; }

            public long UserId { get; set; }

            public string Number { get; set; }

            public long CourseId { get; set; }

            public string FileName { get; set; }

            public FileType FileType { get; set; }

            public long FileSize { get; set; }

            public string FileUrl { get; private set; }
     
            public static CertificateModel Map(Certificate certificate, string fileUrl)
            {
                if (certificate == null) return null;

                return new CertificateModel
                {
                    Id = certificate.Id,
                    UserId = certificate.UserId,
                    Number = certificate.Number,
                    CourseId = certificate.CourseId,
                    FileName = certificate.FileName,
                    FileType = certificate.FileType,
                    FileSize = certificate.FileSize,
                    FileUrl = fileUrl,
                };
            }
        }

        public class SectionModel
        {
            public long CourseId { get; set; }

            public long Id { get; set; }

            public int Priority { get; set; }

            public string Title { get; set; }

            public virtual ICollection<LessonModel> Lessons { get; set; } = new List<LessonModel>();


            public decimal Progress { get; set; }

            public ContentStatus Status { get; set; }

            public double Duration { get; set; }
        }

        public class LessonModel
        {
            public long SectionId { get; set; }

            public long Id { get; set; }

            public int Priority { get; set; }

            public string Title { get; set; }

            public virtual ICollection<ContentModel> Contents { get; set; } = new List<ContentModel>();


            public decimal Progress { get; set; }

            public ContentStatus Status { get; set; }

            public double Duration { get; set; }

            public long CommentsCount { get; set; }
        }

        public class ContentModel
        {
            public long LessonId { get; set; }

            public long Id { get; set; }

            public int Priority { get; set; }

            public QuestionType QuestionType { get; set; }

            public ContentStatus Status { get; set; }

            public QuestionChoice QuestionChoice { get; set; }

            public double Duration { get; set; }

            public long CommentsCount { get; set; }
        }

        public class PaymentModel
        {
            public static PaymentModel Map (Payment payment)
            {
                return new PaymentModel();
            }
        }
    }
}