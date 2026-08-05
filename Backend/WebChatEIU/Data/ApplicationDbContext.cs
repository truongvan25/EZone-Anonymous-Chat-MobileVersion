using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using WebChatEIU.Models;

namespace WebChatEIU.Data
{
    public class ApplicationDbContext : DbContext 
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }
        public DbSet<Users> Users { get; set; }
        public DbSet<ChatRooms> ChatRooms { get; set; }
        public DbSet<Messages> Messages { get; set; }
        public DbSet<ChatReports> ChatReports { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Soft delete: mọi query tới Users tự động ẩn tài khoản đã bị xóa
            // (login, GetMe, check email trùng khi register, admin GetUser, ...)
            // mà không cần sửa filter thủ công ở từng controller.
            modelBuilder.Entity<Users>().HasQueryFilter(u => !u.IsDeleted);

            modelBuilder.Entity<ChatRooms>()
                .HasOne(c => c.User1) 
                .WithMany()
                .HasForeignKey(c => c.User1Id)
                .OnDelete(DeleteBehavior.Restrict); 

            modelBuilder.Entity<ChatRooms>()
                .HasOne(c => c.User2)
                .WithMany()
                .HasForeignKey(c => c.User2Id)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ChatReports>()
                .HasOne(c => c.ReportUser)
                .WithMany()
                .HasForeignKey(c => c.ReporterId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ChatReports>()
                .HasOne(c => c.XUser)
                .WithMany()
                .HasForeignKey(c => c.ReportedUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserRole>().HasKey(ur => new { ur.UserId, ur.RoleId });

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId);

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId);
        }
    }
}
