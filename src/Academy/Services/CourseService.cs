using Academy.Clients.FileClient;
using Academy.Data;
using Academy.Entities;
using Academy.Models;
using Academy.Utilities;
using Academy.Validators;
using Humanizer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using Syncfusion.DocIO;
using Syncfusion.DocIO.DLS;
using Syncfusion.DocIORenderer;
using Syncfusion.OfficeChart;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Academy.Services
{
    public class CourseService
    {
        private readonly IServiceProvider _services;
        private readonly AppDbContext dbContext;
        private readonly IFileClient fileClient;
        private readonly HttpContext httpContext;
        private readonly ILogger<CourseService> logger;
        private readonly UserManager<User> userManager;

        private const int MAX_COURSE_COUNT = 250;

        public CourseService(IServiceProvider services)
        {
            _services = services;
            dbContext = services.GetRequiredService<AppDbContext>();
            fileClient = services.GetRequiredService<IFileClient>();
            httpContext = services.GetRequiredService<IHttpContextAccessor>().HttpContext;
            logger = services.GetRequiredService<ILogger<CourseService>>();
            userManager = services.GetRequiredService<UserManager<User>>();
        }

        public async Task<Result> AddAsync(Course model)
        {
            if (model == null)
                throw new ArgumentNullException(nameof(model));

            var result = await ServiceHelper.ValidateAsync<CourseValidator, Course>(_services, model);
            if (!result.Success)
                return result;

            // Check if maximum number of courses has been reached.
            var courseCount = await dbContext.Set<Course>().CountAsync();
            if (courseCount >= MAX_COURSE_COUNT)
                return Result.Failed(StatusCodes.Status400BadRequest, message: "You've reached the maximum number of courses you can add.");

            var course = new Course();
            MapCourse(model, course);

            course.CreatedOn = DateTimeOffset.UtcNow;
            course.UpdatedOn = DateTimeOffset.UtcNow;

            dbContext.Add(course);
            await dbContext.SaveChangesAsync();

            course = await GetCourseAsync(course.Id);

            return Result.Succeed(data: (await ServiceHelper.GetCourseDataAsync(_services, await httpContext.GetCurrentUserAsync(), new CourseSearchModel { CourseId = course.Id })).Data);
        }

        public async Task<Result> EditAsync(Course model)
        {
            if (model == null)
                throw new ArgumentNullException(nameof(model));

            var result = await ServiceHelper.ValidateAsync<CourseValidator, Course>(_services, model);
            if (!result.Success)
                return result;

            var course = await GetCourseAsync(model.Id);

            if (course == null)
                return Result.Failed(StatusCodes.Status404NotFound);

            MapCourse(model, course);

            course.UpdatedOn = DateTimeOffset.UtcNow;

            dbContext.Update(course);
            await dbContext.SaveChangesAsync();

            return Result.Succeed(data: (await ServiceHelper.GetCourseDataAsync(_services, await httpContext.GetCurrentUserAsync(), new CourseSearchModel { CourseId = course.Id })).Data);
        }

        public async Task<Result> DeleteAsync(Course model)
        {
            if (model == null)
                throw new ArgumentNullException(nameof(model));

            var course = await GetCourseAsync(model.Id);

            if (course == null)
                return Result.Failed(StatusCodes.Status404NotFound);

            dbContext.Remove(course);
            await dbContext.SaveChangesAsync();

            return Result.Succeed(new { Id = course.Id });
        }

        private async Task<Course> GetCourseAsync(long id)
        {
            var course = await dbContext.Set<Course>().AsTracking()
                         .Include(x => x.Image)
                         .Include(x => x.CertificateTemplate)
                         .FirstOrDefaultAsync(x => x.Id == id);

            return course;
        }

        private void MapCourse(Course source, Course target)
        {
            target.Priority = source.Priority;
            target.Id = source.Id;
            target.Title = source.Title;
            target.Description = source.Description;
            target.Published = source.Published;
            target.ImageId = source.ImageId;
            target.CertificateTemplateId = source.CertificateTemplateId;
            target.Fee = source.Fee;
        }

        public async Task<Result> PopulateAsync(CourseSearchModel model)
        {
            if (model == null)
                throw new ArgumentNullException(nameof(model));

            var currentUser = await httpContext.GetCurrentUserAsync();
            var currentUserIsInAdmin = currentUser != null && await userManager.IsInRoleAsync(currentUser, Constants.AdminRole);

            var courses = await ServiceHelper.GetCourseDetailsListAsync(_services, currentUser);

            if (model.CourseId != null && model.SectionId != null && model.LessonId != null && model.ContentId != null)
            {
                var content = courses.FirstOrDefault(course => course.Id == model.CourseId)?.Sections
                                    .FirstOrDefault(section => section.Id == model.SectionId)?.Lessons
                                    .FirstOrDefault(lesson => lesson.Id == model.LessonId)?.Contents
                                    .FirstOrDefault(content => content.Id == model.ContentId);

                if (content == null)
                    return Result.Failed(StatusCodes.Status404NotFound);

                var sourceContent = await dbContext.Set<Content>()
                    .OrderBy(x => x.Priority == 0).ThenBy(x => x.Priority)
                    .Include(x => x.QuestionAnswers.OrderBy(x => x.Priority == 0).ThenBy(x => x.Priority))
                    .Include(x => x.Media).FirstOrDefaultAsync(x => x.Id == model.ContentId);

                return Result.Succeed(data:TypeMerger.Merge(TypeMerger.Merge(new
                    {
                        Media = sourceContent.Media != null ? TypeMerger.Merge(new { FileUrl = fileClient.GetFileUrl(sourceContent.Media.FileName) }, sourceContent.Media) : null,
                        QuestionAnswers = sourceContent.QuestionAnswers.Select(questionAnswer => TypeMerger.Ignore(() => questionAnswer.Content).Merge(new { }, questionAnswer))
                    }, sourceContent), content));
            }

            if (model.CourseId != null && model.SectionId != null && model.LessonId != null)
            {
                var lesson = courses.FirstOrDefault(course => course.Id == model.CourseId)?.Sections
                                    .FirstOrDefault(section => section.Id == model.SectionId)?.Lessons
                                    .FirstOrDefault(lesson => lesson.Id == model.LessonId);

                return Result.Succeed(data: lesson);

            }

            if (model.CourseId != null && model.SectionId != null)
            {
                var section = courses.FirstOrDefault(course => course.Id == model.CourseId)?.Sections
                                     .FirstOrDefault(section => section.Id == model.SectionId);

                if (section == null)
                    return Result.Failed(StatusCodes.Status404NotFound);

                return Result.Succeed(data: section);
            }

            if (model.CourseId != null)
            {
                var course = courses.FirstOrDefault(course => course.Id == model.CourseId);

                if (course == null)
                    return Result.Failed(StatusCodes.Status404NotFound);

                return Result.Succeed(data: course);
            }

            return Result.Succeed(data: courses);
        }

        public async Task<Result> ReorderAsync(CourseReorderModel model)
        {
            if (model == null)
                throw new ArgumentNullException(nameof(model));

            if (model.Destination == null ||
                model.Destination.DroppableId == model.Source.DroppableId &&
                model.Destination.Index == model.Source.Index)
            {

            }
            else
            {
                if (model.Type.Equals(nameof(Course), StringComparison.InvariantCultureIgnoreCase))
                {
                    var source = model.Source;
                    var destination = model.Destination;

                    var query = dbContext.Set<Course>().AsQueryable();
                    query = query.OrderBy(x => x.Priority == 0).ThenBy(x => x.Priority);
                    var items = await query.ToListAsync();


                    var reorderItem = items.Splice(source.Index, 1).First();
                    items.Splice(destination.Index, 0, reorderItem);
                    items.ForEach((item, itemIndex) =>
                    {
                        item.Priority = itemIndex + 1;
                        dbContext.Update(item);
                    });

                    await dbContext.SaveChangesAsync();
                }
                else if (model.Type.Equals(nameof(Content), StringComparison.InvariantCultureIgnoreCase))
                {
                    var source = model.Source;
                    var destination = model.Destination;

                    var query = dbContext.Set<Content>().AsQueryable();
                    query = query.Where(x => x.LessonId == model.ParentId);
                    query = query.OrderBy(x => x.Priority == 0).ThenBy(x => x.Priority);
                    var items = await query.ToListAsync();


                    var reorderItem = items.Splice(source.Index, 1).First();
                    items.Splice(destination.Index, 0, reorderItem);
                    items.ForEach((item, itemIndex) =>
                    {
                        item.Priority = itemIndex + 1;
                        dbContext.Update(item);
                    });

                    await dbContext.SaveChangesAsync();
                }
                else
                {
                    var source = model.Source;
                    var destination = model.Destination;

                    var query = dbContext.Set<Section>().AsQueryable();
                    query = query.Where(x => x.CourseId == model.ParentId);
                    query = query = query.Include(x => x.Lessons.OrderBy(x => x.Priority == 0).ThenBy(x => x.Priority));
                    query = query.OrderBy(x => x.Priority == 0).ThenBy(x => x.Priority);
                    var items = await query.ToListAsync();

                    if (model.Type.Equals(nameof(Section), StringComparison.InvariantCultureIgnoreCase))
                    {
                        var reorderItem = items.Splice(source.Index, 1).First();
                        items.Splice(destination.Index, 0, reorderItem);
                        items.ForEach((item, itemIndex) =>
                        {
                            item.Priority = itemIndex + 1;
                            dbContext.Update(item);
                        });

                        await dbContext.SaveChangesAsync();
                    }
                    else if (model.Type.Equals(nameof(Lesson), StringComparison.InvariantCultureIgnoreCase))
                    {
                        var startItem = items.First(x => x.Id == source.DroppableId);
                        var finishItem = items.First(x => x.Id == destination.DroppableId);

                        var startUnits = startItem.Lessons.ToList();

                        if (startItem == finishItem)
                        {
                            var reorderUnit = startUnits.Splice(source.Index, 1).First();
                            startUnits.Splice(destination.Index, 0, reorderUnit);
                            startUnits.ForEach((unit, unitIndex) =>
                            {
                                unit.Priority = unitIndex + 1;
                                dbContext.Update(unit);
                            });
                        }
                        else
                        {
                            var reorderUnit = startUnits.Splice(source.Index, 1).First();
                            startUnits.ForEach((unit, unitIndex) =>
                            {
                                unit.Priority = unitIndex + 1;
                                dbContext.Update(unit);
                            });

                            reorderUnit.Section = null;
                            reorderUnit.SectionId = finishItem.Id;

                            var finishUnits = finishItem.Lessons.ToList();
                            finishUnits.Splice(destination.Index, 0, reorderUnit);
                            finishUnits.ForEach((unit, unitIndex) =>
                            {
                                unit.Priority = unitIndex + 1;
                                dbContext.Update(unit);
                            });
                        }

                        await dbContext.SaveChangesAsync();
                    }
                }
            }

            return Result.Succeed();
        }

        public async Task<Result> ProgressAsync(CourseProgressModel model)
        {
            if (model == null)
                throw new ArgumentNullException(nameof(model));

            var currentUser = await httpContext.GetCurrentUserAsync();
            var currentUserIsInAdmin = currentUser != null && await userManager.IsInRoleAsync(currentUser, Constants.AdminRole);

            if (currentUser == null)
                return Result.Failed(StatusCodes.Status400BadRequest);

            var courses = await ServiceHelper.GetCourseDetailsListAsync(_services, currentUser);

            var course = courses.FirstOrDefault(course => course.Sections.SelectMany(section => section.Lessons.SelectMany(lesson => lesson.Contents)).Any(x => x.Id == model.ContentId));
            var content = course?.Sections.SelectMany(section => section.Lessons.SelectMany(lesson => lesson.Contents)).FirstOrDefault(content => content.Id == model.ContentId);

            if (course == null || content == null)
                return Result.Failed(StatusCodes.Status400BadRequest);

            var correct = false;
            var entireAnswers = await dbContext.Set<QuestionAnswer>().Where(x => x.ContentId == content.Id).ToListAsync();

            var selectedAnswerIds = model.QuestionAnwserIds ?? Array.Empty<long>();
            var correctAnwserIds = entireAnswers.Where(x => x.Correct).Select(x => x.Id).ToList();
            var entireAnwserIds = entireAnswers.Select(x => x.Id).ToList();

            if (content.QuestionType == QuestionType.Choice)
                correct = Enumerable.SequenceEqual(selectedAnswerIds.OrderBy(x => x), correctAnwserIds.OrderBy(x => x));

            else if (content.QuestionType == QuestionType.Reorder)
                correct = Enumerable.SequenceEqual(selectedAnswerIds, entireAnwserIds);

            var contentProgress = currentUser.ContentProgresses.FirstOrDefault(x => x.ContentId == content.Id);

            if (contentProgress == null)
            {
                contentProgress = new ContentProgress() { Points = Settings.AppSettings.Grading.Points };
                contentProgress.UserId = currentUser.Id;
                contentProgress.ContentId = content.Id;
                contentProgress.CreatedOn = DateTimeOffset.UtcNow;
                contentProgress.UpdatedOn = DateTimeOffset.UtcNow;

                contentProgress.Checked = contentProgress.Checked || correct;
                contentProgress.Points = contentProgress.Checked ? contentProgress.Points : Math.Max(0, contentProgress.Points - 1);
                contentProgress.Correct = correct;

                dbContext.Add(contentProgress);
                await dbContext.SaveChangesAsync();
            }
            else
            {
                contentProgress.UpdatedOn = DateTimeOffset.UtcNow;
                contentProgress.Checked = contentProgress.Checked || correct;
                contentProgress.Points = contentProgress.Checked ? contentProgress.Points : Math.Max(0, contentProgress.Points - 1);

                dbContext.Update(contentProgress);
                await dbContext.SaveChangesAsync();
            }

            if (correct)
            {
                var contents = course.Sections.SelectMany(x => x.Lessons).SelectMany(x => x.Contents).ToList();
                contents.Replace(content, new CourseDetailsModel.ContentModel
                {
                    LessonId = content.LessonId,
                    Id = content.Id,
                    Priority = content.Priority,
                    QuestionType = content.QuestionType,
                    Status = ContentStatus.Completed,
                });

                if (content.Id == contents.Last().Id && contents.All(content => content.Status == ContentStatus.Completed))
                {
                    // Generate certificate from template.
                    if (course.CertificateTemplate != null)
                    {
                        var certificateNumber = ComputeHelper.GenerateRandomString(6, ComputeHelper.WHOLE_NUMERIC_CHARS);

                        var certificateFileName = ComputeHelper.GenerateSafeFileName($"{course.Title} Certificate.pdf");
                        var certificateFileType = FileType.Document;
                        var certificateFileUrl = fileClient.GetFileUrl(certificateFileName);

                        async Task<Stream> generateCertificateFileStream()
                        {
                            using var inputStream = await fileClient.GetFileStreamAsync(course.CertificateTemplate.FileName);
                            var wordDocument = new WordDocument(inputStream, FormatType.Automatic);
                            var entry = new
                            {
                                Course_Title = course.Title,
                                Learner_Name = currentUser.PreferredName,
                                Certificate_Number = certificateNumber,
                                Certificate_IssuedOn = DateTimeOffset.UtcNow,
                                Certificate_Url = certificateFileUrl,
                            };

                            var fieldNames = entry.GetType().GetProperties().Select(x => x.Name).ToArray();
                            var fieldValues = entry.GetType().GetProperties().Select(x => x.GetValue(entry)?.ToString()).ToArray();

                            wordDocument.MailMerge.Execute(fieldNames, fieldValues);

                            // Instantiation of DocIORenderer for Word to PDF conversion
                            var render = new DocIORenderer();
                            // Sets Chart rendering Options.
                            render.Settings.ChartRenderingOptions.ImageFormat = ExportImageFormat.Jpeg;
                            // Converts Word document into PDF document
                            var pdfDocument = render.ConvertToPDF(wordDocument);
                            //Releases all resources used by the Word document and DocIO Renderer objects
                            render.Dispose();
                            wordDocument.Dispose();
                            // Saves the PDF file
                            var fileStream = new MemoryStream();
                            pdfDocument.Save(fileStream);
                            // Closes the instance of PDF document object
                            pdfDocument.Close();
                            // Set position to 0.
                            fileStream.Position = 0;

                            return fileStream;
                        }

                        var certificateFileStream = await generateCertificateFileStream();
                        var certificateFileSize = certificateFileStream.Length;

                        await fileClient.WriteFileAsync(certificateFileName, certificateFileStream);

                        var certificate = currentUser.Certificates.FirstOrDefault(x => x.CourseId == course.Id);

                        if (certificate == null)
                        {
                            certificate = new Certificate()
                            {
                                UserId = currentUser.Id,
                                CourseId = course.Id,

                                Number = certificateNumber,
                                FileName = certificateFileName,
                                FileSize = certificateFileSize,
                                FileType = certificateFileType,
                            };

                            dbContext.Add(certificate);
                            await dbContext.SaveChangesAsync();
                        }
                        else
                        {
                            certificate.Number = certificateNumber;
                            certificate.FileName = certificateFileName;
                            certificate.FileSize = certificateFileSize;
                            certificate.FileType = certificateFileType;

                            dbContext.Update(certificate);
                            await dbContext.SaveChangesAsync();
                        }
                    }
                }
            }

            return Result.Succeed(data: correct);
        }

        public async Task<Result> ExportAsync()
        {
            var courses = await dbContext.Set<Course>().AsSplitQuery()
                .Include(x => x.Image)
                .Include(x => x.CertificateTemplate)
                .Include(x => x.Sections).ThenInclude(x => x.Lessons)
                .ToListAsync();

            async Task writeStream(JsonTextWriter writer, string fileName, FileType fileType, long fileSize)
            {
                writer.WriteStartObject();
                {
                    writer.WritePropertyName("fileName");
                    writer.WriteValue(ComputeHelper.GenerateSafeFileName(fileName));

                    writer.WritePropertyName("fileType");
                    writer.WriteValue(fileType.ToString().Camelize());

                    writer.WritePropertyName("fileSize");
                    writer.WriteValue(fileSize);

                    writer.WritePropertyName("fileSource");

                    var stream = fileName != null ? await fileClient.GetFileStreamAsync(fileName) : null;

                    if (stream != null)
                    {
                        const int MAX_BUFFER = 4096; // 4KB this is the chunk size read from file.
                        byte[] buffer = new byte[MAX_BUFFER];
                        int bytesRead;

                        using (var bufferedStream = new BufferedStream(stream))
                        {
                            writer.WriteStartArray();
                            {
                                while ((bytesRead = await bufferedStream.ReadAsync(buffer, 0, MAX_BUFFER)) != 0)
                                {
                                    writer.WriteValue(Convert.ToBase64String(buffer));
                                }
                            }

                            writer.WriteEndArray();
                        }
                    }
                    else
                    {
                        writer.WriteNull();
                    }
                }
                writer.WriteEndObject();
            }
            var exportFileName = ComputeHelper.GenerateSafeFileName("Courses.json");
            var exportFileSize = default(long);

            using (var stream = await fileClient.GenerateFileStreamAsync(exportFileName))
            using (var streamWriter = new StreamWriter(stream))
            using (var writer = new JsonTextWriter(streamWriter))
            {
                var resolver = Settings.SerializerSettings.ContractResolver as DefaultContractResolver;

                writer.Formatting = Formatting.Indented;

                writer.WriteStartArray();
                {
                    foreach (var course in courses)
                    {
                        writer.WriteStartObject();
                        {
                            writer.WritePropertyName(resolver.GetResolvedPropertyName(nameof(course.Title)));
                            writer.WriteValue(course.Title);


                            writer.WritePropertyName(resolver.GetResolvedPropertyName(nameof(course.Description)));
                            writer.WriteValue(course.Description);

                            writer.WritePropertyName(resolver.GetResolvedPropertyName(nameof(course.Fee)));
                            writer.WriteValue(course.Fee);

                            writer.WritePropertyName(resolver.GetResolvedPropertyName(nameof(course.Published)));
                            writer.WriteValue(course.Published);


                            writer.WritePropertyName(resolver.GetResolvedPropertyName(nameof(course.Image)));
                            if (course.Image != null) await writeStream(writer, course.Image.FileName, course.Image.FileType, course.Image.FileSize);
                            else writer.WriteNull();


                            writer.WritePropertyName(resolver.GetResolvedPropertyName(nameof(course.CertificateTemplate)));
                            if (course.CertificateTemplate != null) await writeStream(writer, course.CertificateTemplate.FileName, course.CertificateTemplate.FileType, course.CertificateTemplate.FileSize);
                            else writer.WriteNull();


                            writer.WritePropertyName(resolver.GetResolvedPropertyName(nameof(course.Sections)));
                            writer.WriteStartArray();
                            {
                                foreach (var section in course.Sections)
                                {
                                    writer.WriteStartObject();
                                    {
                                        writer.WritePropertyName(resolver.GetResolvedPropertyName(nameof(section.Title)));
                                        writer.WriteValue(section.Title);


                                        writer.WritePropertyName(resolver.GetResolvedPropertyName(nameof(section.Lessons)));
                                        writer.WriteStartArray();
                                        {
                                            foreach (var lesson in section.Lessons)
                                            {
                                                writer.WriteStartObject();
                                                {
                                                    writer.WritePropertyName(resolver.GetResolvedPropertyName(nameof(lesson.Title)));
                                                    writer.WriteValue(lesson.Title);


                                                    writer.WritePropertyName(resolver.GetResolvedPropertyName(nameof(lesson.Contents)));
                                                    writer.WriteStartArray();
                                                    {
                                                        var contentIds = await dbContext.Set<Content>().Where(x => x.LessonId == lesson.Id).Select(x => x.Id).ToListAsync();

                                                        foreach (var contentId in contentIds)
                                                        {
                                                            var content = await dbContext.Set<Content>()
                                                                .OrderBy(x => x.Priority == 0).ThenBy(x => x.Priority)
                                                                .Include(x => x.QuestionAnswers.OrderBy(x => x.Priority == 0).ThenBy(x => x.Priority))
                                                                .Include(x => x.Media).FirstOrDefaultAsync(x => x.Id == contentId);

                                                            writer.WriteStartObject();
                                                            {
                                                                writer.WritePropertyName(resolver.GetResolvedPropertyName(nameof(content.Explanation)));
                                                                writer.WriteValue(content.Explanation);


                                                                writer.WritePropertyName(resolver.GetResolvedPropertyName(nameof(content.Question)));
                                                                writer.WriteValue(content.Question);


                                                                writer.WritePropertyName(resolver.GetResolvedPropertyName(nameof(content.QuestionType)));
                                                                writer.WriteValue(content.QuestionType.ToString().Camelize());

                                                                writer.WritePropertyName(resolver.GetResolvedPropertyName(nameof(content.Duration)));
                                                                writer.WriteValue(content.Duration);

                                                                writer.WritePropertyName(resolver.GetResolvedPropertyName(nameof(content.Media)));
                                                                if (content.Media != null) await writeStream(writer, content.Media.FileName, content.Media.FileType, content.Media.FileSize);
                                                                else writer.WriteNull();


                                                                writer.WritePropertyName(resolver.GetResolvedPropertyName(nameof(content.QuestionAnswers)));
                                                                writer.WriteStartArray();
                                                                {
                                                                    foreach (var questionAnwser in content.QuestionAnswers)
                                                                    {
                                                                        writer.WriteStartObject();
                                                                        {
                                                                            writer.WritePropertyName(resolver.GetResolvedPropertyName(nameof(questionAnwser.Description)));
                                                                            writer.WriteValue(questionAnwser.Description);


                                                                            writer.WritePropertyName(resolver.GetResolvedPropertyName(nameof(questionAnwser.Correct)));
                                                                            writer.WriteValue(questionAnwser.Correct);
                                                                        }
                                                                        writer.WriteEndObject();
                                                                    }
                                                                }
                                                                writer.WriteEndArray();
                                                            }
                                                            writer.WriteEndObject();
                                                        }
                                                    }
                                                    writer.WriteEndArray();
                                                }
                                                writer.WriteEndObject();
                                            }
                                        }
                                        writer.WriteEndArray();
                                    }
                                    writer.WriteEndObject();
                                }
                            }
                            writer.WriteEndArray();
                        }
                        writer.WriteEndObject();
                    }
                }
                writer.WriteEndArray();

                // Get the file size.
                exportFileSize = stream.Length;
            }

            var exportDocument = new
            {
                FileName = exportFileName,
                FileSize = exportFileSize,
                FileType = FileType.Document,
                FileUrl = fileClient.GetFileUrl(exportFileName),
            };

            return Result.Succeed(data: exportDocument);
        }

        public async Task<Result> ImportAsync(CourseImportModel model)
        {
            var importDocument = await dbContext.Set<Asset>().FirstOrDefaultAsync(x => x.Id == model.DocumentId);

            if (importDocument == null) 
                return Result.Failed(StatusCodes.Status404NotFound);

            async Task SaveFile(JToken fileToken)
            {
                if (fileToken != null)
                {
                    var fileName = fileToken.Value<string>("fileName");
                    var fileType = fileToken.Value<string>("fileType").Parse<FileType>();
                    var fileSize = fileToken.Value<long>("fileSize");

                    var fileSourceTokenArray = fileToken.SelectToken("fileSource") as JArray;

                    if (fileSourceTokenArray != null)
                    {
                        foreach (var fileSourceToken in fileSourceTokenArray)
                        {
                            await fileClient.WriteFileAsync(fileName, new MemoryStream(Convert.FromBase64String(fileSourceToken.Value<string>())));
                        }
                    }
                }
            }

            using (var stream = await fileClient.GetFileStreamAsync(importDocument.FileName))
            using (var streamReader = new StreamReader(stream))
            using (var reader = new JsonTextReader(streamReader))
            {
                var resolver = Settings.SerializerSettings.ContractResolver as DefaultContractResolver;

                var coursePriority = 0;
                while (await reader.ReadAsync())
                {
                    if (reader.TokenType == JsonToken.StartObject)
                    {
                        var courseToken = JObject.Load(reader);

                        var courseImageAsset = default(Asset);
                        var courseImageToken = courseToken.SelectToken(resolver.GetResolvedPropertyName(nameof(Course.Image)));
                        if (courseImageToken.Type != JTokenType.Null)
                        {
                            dbContext.Add(courseImageAsset = new Asset
                            {
                                FileName = courseImageToken.Value<string>("fileName"),
                                FileSize = courseImageToken.Value<long>("fileSize"),
                                FileType = courseImageToken.Value<string>("fileType").Parse<FileType>(),
                            });
                            await dbContext.SaveChangesAsync();
                            await SaveFile(courseImageToken);
                        }
                      
                        var courseCertificateTemplateAsset = default(Asset);
                        var courseCertificateTemplateToken = courseToken.SelectToken(resolver.GetResolvedPropertyName(nameof(Course.CertificateTemplate)));
                        if (courseCertificateTemplateToken.Type != JTokenType.Null)
                        {
                            dbContext.Add(courseCertificateTemplateAsset = new Asset
                            {
                                FileName = courseCertificateTemplateToken.Value<string>("fileName"),
                                FileSize = courseCertificateTemplateToken.Value<long>("fileSize"),
                                FileType = courseCertificateTemplateToken.Value<string>("fileType").Parse<FileType>(),
                            });
                            await dbContext.SaveChangesAsync();
                            await SaveFile(courseCertificateTemplateToken);
                        }

                        var course = new Course
                        {
                            Priority = ++coursePriority,
                            Title = courseToken.Value<string>(resolver.GetResolvedPropertyName(nameof(Course.Title))),
                            Description = courseToken.Value<string>(resolver.GetResolvedPropertyName(nameof(Course.Description))),
                            Published = courseToken.Value<bool>(resolver.GetResolvedPropertyName(nameof(Course.Published))),
                            Fee = courseToken.Value<decimal>(resolver.GetResolvedPropertyName(nameof(Course.Fee))),
                            CreatedOn = DateTimeOffset.UtcNow,
                            UpdatedOn = DateTimeOffset.UtcNow,
                            ImageId = courseImageAsset?.Id,
                            CertificateTemplateId = courseCertificateTemplateAsset?.Id
                        };
                        
                        // Add and save Course.
                        dbContext.Add(course);
                        await dbContext.SaveChangesAsync();


                        var sectionTokens = courseToken.SelectTokens($"{resolver.GetResolvedPropertyName(nameof(Course.Sections))}[*]");
                        var sectionPriority = 0;

                        foreach (var sectionToken in sectionTokens)
                        {
                            var section = new Section
                            {
                                CourseId = course.Id,
                                Priority = ++sectionPriority,
                                Title = sectionToken.Value<string>(resolver.GetResolvedPropertyName(nameof(Section.Title)))
                            };

                            // Add and save Section.
                            dbContext.Add(section);
                            await dbContext.SaveChangesAsync();

                            var lessonPriority = 0;
                            var lessonTokens = sectionToken.SelectTokens($"{resolver.GetResolvedPropertyName(nameof(Section.Lessons))}[*]");

                            foreach (var lessonToken in lessonTokens)
                            {
                                var lesson = new Lesson
                                {
                                    SectionId = section.Id,
                                    Priority = ++lessonPriority,
                                    Title = lessonToken.Value<string>(resolver.GetResolvedPropertyName(nameof(Section.Title)))
                                };

                                // Add and save Lesson.
                                dbContext.Add(lesson);
                                await dbContext.SaveChangesAsync();

                                var contentPriority = 0;
                                var contentTokens = lessonToken.SelectTokens($"{resolver.GetResolvedPropertyName(nameof(Lesson.Contents))}[*]");

                                foreach (var contentToken in contentTokens)
                                {
                                    var contentMediaAsset = default(Asset);
                                    var contentMediaToken = contentToken.SelectToken(resolver.GetResolvedPropertyName(nameof(Content.Media)));
                                   
                                    if (contentMediaToken.Type != JTokenType.Null)
                                    {
                                        dbContext.Add(contentMediaAsset = new Asset
                                        {
                                            FileName = contentMediaToken.Value<string>("fileName"),
                                            FileSize = contentMediaToken.Value<long>("fileSize"),
                                            FileType = contentMediaToken.Value<string>("fileType").Parse<FileType>(),
                                        });
                                        await dbContext.SaveChangesAsync();
                                        await SaveFile(contentMediaToken);
                                    }


                                    var content = new Content
                                    {
                                        LessonId = lesson.Id,
                                        Priority = ++contentPriority,
                                        Explanation = contentToken.Value<string>(resolver.GetResolvedPropertyName(nameof(Content.Explanation))),
                                        Question = contentToken.Value<string>(resolver.GetResolvedPropertyName(nameof(Content.Question))),
                                        QuestionType = contentToken.Value<string>(resolver.GetResolvedPropertyName(nameof(Content.QuestionType))).Parse<QuestionType>(),
                                        Duration = contentToken.Value<string>(resolver.GetResolvedPropertyName(nameof(Content.Duration))).Parse<double>(),
                                        MediaId = contentMediaAsset?.Id
                                    };

                                    // Add and save Content.
                                    dbContext.Add(content);
                                    await dbContext.SaveChangesAsync();

                                    var questionAnswerPriority = 0;
                                    var questionAnswerTokens = contentToken.SelectTokens($"{resolver.GetResolvedPropertyName(nameof(Content.QuestionAnswers))}[*]");

                                    foreach (var questionAnswerToken in questionAnswerTokens)
                                    {
                                        var questionAnswer = new QuestionAnswer
                                        {
                                            ContentId = content.Id,
                                            Priority = ++questionAnswerPriority,
                                            Description = questionAnswerToken.Value<string>(resolver.GetResolvedPropertyName(nameof(QuestionAnswer.Description))),
                                            Correct = questionAnswerToken.Value<bool>(resolver.GetResolvedPropertyName(nameof(QuestionAnswer.Correct)))
                                        };

                                        // Add and save QuestionAnswer.
                                        dbContext.Add(questionAnswer);
                                        await dbContext.SaveChangesAsync();
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return Result.Succeed();
        }
    }
}
