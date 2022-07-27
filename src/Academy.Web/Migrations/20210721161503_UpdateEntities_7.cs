using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Academy.Web.Migrations
{
    public partial class UpdateEntities_7 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ReferenceId",
                table: "Payment",
                newName: "RefString");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "Period",
                table: "Payment",
                type: "datetimeoffset",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Period",
                table: "Payment");

            migrationBuilder.RenameColumn(
                name: "RefString",
                table: "Payment",
                newName: "ReferenceId");
        }
    }
}
