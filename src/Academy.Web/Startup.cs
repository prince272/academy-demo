using Academy.Clients.FileClient;
using Academy.Data;
using Academy.Entities;
using Academy.Services;
using Academy.Utilities;
using Academy.Web.Extensions;
using Academy.Web.Middlewares;
using AutoMapper;
using Humanizer;
using MediatR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SpaServices;
using Microsoft.AspNetCore.SpaServices.ReactDevelopmentServer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Serialization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using static Academy.AppSettings;

namespace Academy.Web
{
    public class Startup
    {
        public Startup(IConfiguration configuration, IWebHostEnvironment environment)
        {
            Configuration = configuration;
            Environment = environment;
        }

        public IConfiguration Configuration { get; }

        public IWebHostEnvironment Environment { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            Settings.AppSettingsFunc = () =>
            {
                return new AppSettings
                {
                    Culture = new CultureOptions
                    {
                        CurrencyName = "Ghanaian Cedi",
                        CurrencySymbol = "GH₵",

                        CountryName = "Ghana",
                        CountryCode = "GH",

                    },

                    Grading = new GradingOptions
                    {
                        Data = new List<Grade>
                        {
                            new Grade { Medal = GradeMedal.None, Points = new int[] { 0, 50, 150, 300 } },
                            new Grade { Medal = GradeMedal.Bronze, Points = new int[] { 500, 1000 } },
                            new Grade { Medal = GradeMedal.Silver, Points = new int[] { 2000, 3000, 4000 } },
                            new Grade { Medal = GradeMedal.Gold, Points = new int[] { 5000, 6500, 8000, 10000, 13000, 15000 } },
                            new Grade { Medal = GradeMedal.Platinum, Points = new int[] { 20000, 100000, 500000, 750000, 1000000 } }
                        },
                        Points = 5,
                    }
                };
            };

            services.AddDbContext<AppDbContext>(dbOptions =>
            {
                dbOptions.UseSqlServer(Configuration.GetConnectionString("DefaultConnection"),
                    sqlOptions =>
                    {
                        sqlOptions.MigrationsAssembly(Assembly.GetExecutingAssembly().GetName().Name);
                    });

                dbOptions.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);

                dbOptions.ConfigureWarnings(w => w.Throw(RelationalEventId.MultipleCollectionIncludeWarning));
            });

            services.AddDatabaseDeveloperPageExceptionFilter();

            services.AddIdentity<User, Role>(options =>
            {
                // Password settings.
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.Password.RequiredLength = 0;
                options.Password.RequiredUniqueChars = 0;

                // Lockout settings.
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.AllowedForNewUsers = true;

                // User settings.
                options.User.AllowedUserNameCharacters = null;
                options.User.RequireUniqueEmail = false;

                options.SignIn.RequireConfirmedAccount = false;
                options.SignIn.RequireConfirmedEmail = false;
                options.SignIn.RequireConfirmedPhoneNumber = false;

                // Generate Short Code for Email Confirmation using Asp.Net Identity core 2.1
                // source: https://stackoverflow.com/questions/53616142/generate-short-code-for-email-confirmation-using-asp-net-identity-core-2-1
                options.Tokens.EmailConfirmationTokenProvider = TokenOptions.DefaultEmailProvider;
                options.Tokens.ChangeEmailTokenProvider = TokenOptions.DefaultEmailProvider;
                options.Tokens.PasswordResetTokenProvider = TokenOptions.DefaultEmailProvider;
            })
                .AddDefaultTokenProviders()
                .AddEntityFrameworkStores<AppDbContext>();

            services.AddIdentityServer()
                .AddApiAuthorization<User, AppDbContext>();

            services.AddAuthentication()
                .AddIdentityServerJwt();

            services.AddResponseCompression();

            services.AddControllersWithViews()
                       .AddNewtonsoftJson(options =>
                       {
                           options.SerializerSettings.Converters.Add(new StringEnumConverter(new CamelCaseNamingStrategy 
                           {
                               ProcessDictionaryKeys = true,
                               ProcessExtensionDataNames = true,
                           }));
                           options.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
                           Settings.SerializerSettingsFunc = () => options.SerializerSettings;
                       });

            services.AddRazorPages();

            services.ConfigureApplicationCookie(options =>
            {
                // Cookie settings
                options.Cookie.HttpOnly = true;
                options.ExpireTimeSpan = TimeSpan.FromDays(365);
                options.SlidingExpiration = true;

                options.ReturnUrlParameter = "returnUrl";
                options.LoginPath = "/account/login";
                options.LogoutPath = "/account/logout";
                options.AccessDeniedPath = "/account/access-denied";
                options.SlidingExpiration = true;

                options.Events.OnRedirectToLogin = context =>
                {
                    if (context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase) && context.Response.StatusCode == StatusCodes.Status200OK)
                    {
                        var result = Result.Failed(StatusCodes.Status401Unauthorized);

                        context.Response.StatusCode = result.Code;
                        context.Response.WriteAsync(JsonConvert.SerializeObject(result, Settings.SerializerSettings));
                    }
                    else
                    {
                        context.Response.Redirect(context.RedirectUri);
                    }

                    return Task.CompletedTask;
                };

                options.Events.OnRedirectToAccessDenied = context =>
                {
                    if (context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase) && context.Response.StatusCode == StatusCodes.Status200OK)
                    {
                        var result = Result.Failed(StatusCodes.Status403Forbidden);

                        context.Response.StatusCode = result.Code;
                        context.Response.WriteAsync(JsonConvert.SerializeObject(result, Settings.SerializerSettings));
                    }
                    else
                    {
                        context.Response.Redirect(context.RedirectUri);
                    }

                    return Task.CompletedTask;
                };
            });

            services.Configure<ApiBehaviorOptions>(options =>
            {
                options.InvalidModelStateResponseFactory = context =>
                {
                    var result = Result.Failed(StatusCodes.Status400BadRequest,
                        errors: context.ModelState.Select(modelState =>
                        {
                            var key = modelState.Key;
                            var value = modelState.Value.Errors?.Select(x => x.ErrorMessage).Humanize();
                            return new { key, value };
                        }).ToDictionary(x => x.key, x => x.value));

                    return new ObjectResult(result) { StatusCode = result.Code };
                };
            });

            services.Configure<AssetOptions>((options) =>
            {
                options.ImageFileSize = 5242880L; // 5MB
                options.VideoFileSize = 524288000L; // 500MB
                options.AudioFileSize = 83886080L; // 80MB
                options.DocumentFileSize = 262144000L; // 250MB

                // Allowed File Types
                // source: https://help.edublogs.org/allowed-file-types/
                options.ImageFileExtensions = new[] { ".jpg", ".jpeg", ".png" };
                options.VideoFileExtensions = new[] { ".mp4", ".webm", ".swf", ".flv" };
                options.AudioFileExtensions = new string[] { ".mp3", ".ogg", ".wav", };
                options.DocumentFileExtensions = new string[] { ".doc", ".docx", ".rtf", ".pdf", ".json" };
            });

            services.Configure<SpaOptions>(options =>
            {
                options.SourcePath = "ClientApp";
            });

            // In production, the React files will be served from this directory
            services.AddSpaStaticFiles(options =>
            {
                options.RootPath = "ClientApp/build";
            });

            services.AddScoped<CourseService>();
            services.AddScoped<SectionService>();
            services.AddScoped<LessonService>();
            services.AddScoped<ContentService>();
            services.AddScoped<AssetService>();
            services.AddScoped<UserService>();
            services.AddScoped<CommentService>();

            services.AddLocalFileClient(options =>
            {
                options.RootPath = "wwwroot/user-content";
            });
            services.AddMemoryCacheClient(options =>
            {
                options.CacheLifespan = TimeSpan.FromSeconds(10);
            });
            services.AddSmtpEmailClient(options =>
            {
                options.SenderEmail = "info@academydemo.com";
                options.SenderName = "Academy Demo";
                options.SenderPassword = "prince@1234";
                options.MailServer = "mail.academydemo.com";
                options.MailPort = 8889;
                options.UseSSL = false;
            });
            services.AddTwilioSmsClient(options =>
            {
                options.AccountSID = "AC195899b71a9751902fa749df080b896c";
                options.AuthToken = "29796500f53815ad22930d85849ae443";
                options.PhoneNumber = "+13864015944";
            });
            services.AddRazorViewClient();
            services.AddPaySwitchClient(options =>
            {
                options.ApiUser = "neimart5f4d2b7fb7841";
                options.ApiKey = "YTI1NzM5ZjNlNWQ1ZmM0YjU5NWM5NGU5MTk2OWVmOTg=";
                options.MerchantId = "TTM-00004303";
                options.Live = true;
            });

            services.AddMediatR(Assembly.GetExecutingAssembly());
            services.AddAutoMapper(Assembly.GetExecutingAssembly());

            // Register the Swagger generator, defining 1 or more Swagger documents
            services.AddSwaggerGen();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            //Register Syncfusion license
            Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense("NDMwMjM2QDMxMzkyZTMxMmUzMGwwYkdEVnlDMElHTTZ3TmFGd1JRMEp6TC9ZOXNmZ3A1czRDQVYxY1FLa0k9");

            if (env.IsDevelopment())
            {
                app.UseMigrationsEndPoint();


                // Enable middleware to serve generated Swagger as a JSON endpoint.
                app.UseSwagger();

                // Enable middleware to serve swagger-ui (HTML, JS, CSS, etc.),
                // specifying the Swagger JSON endpoint.
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V1");
                });
            }
            else
            {
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            // Developer & Client Exception Response
            app.UseWhen(context => context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase),
                app => app.UseExceptionHandler(app => app.Run(async context =>
                {
                    var exceptionHandlerPathFeature = context.Features.Get<IExceptionHandlerPathFeature>();
                    var exception = exceptionHandlerPathFeature.Error;
                    await context.Response.WriteAsJsonAsync(Result.Failed(StatusCodes.Status500InternalServerError));
                })));

            // Developer Exception Page
            app.UseWhen(context => env.IsDevelopment() && !context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase), app => app.UseDeveloperExceptionPage());

            // Client Exception Page
            app.UseWhen(context => !env.IsDevelopment() && !context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase), app => app.UseExceptionHandler("/Error"));

            app.UseHttpsRedirection();

            app.UseResponseCompression();

            app.UseStaticFiles();
            app.UseSpaStaticFiles();

            app.UseDatabaseTransaction();

            app.UseRouting();

            app.UseAuthentication();
            app.UseIdentityServer();
            app.UseAuthorization();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller}/{action=Index}/{id?}");
            });

            app.UseSpa(spa =>
            {
                TaskHelper.RunSync(() => app.GenerateReactDefaultPage(serverPage: "~/Views/Home/Index.cshtml", clientPage: "/index.html"));

                if (env.IsDevelopment())
                {
                    spa.UseReactDevelopmentServer(npmScript: "start");
                }
            });
        }
    }
}