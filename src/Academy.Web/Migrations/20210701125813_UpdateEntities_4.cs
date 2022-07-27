using Microsoft.EntityFrameworkCore.Migrations;

namespace Academy.Web.Migrations
{
    public partial class UpdateEntities_4 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Marks",
                table: "ContentProgress",
                newName: "Points");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Points",
                table: "ContentProgress",
                newName: "Marks");
        }
    }
}
