namespace WarriorFitnessManageSystem.Api.Data.Entities;

public class SiteImage
{
    public Guid SiteImageID { get; set; }
    public string SiteImageCategory { get; set; } = string.Empty;
    public string SiteImageStoragePath { get; set; } = string.Empty;
    public string SiteImageAltText { get; set; } = string.Empty;
    public string? SiteImageLinkUrl { get; set; }
    public int SiteImageSortOrder { get; set; }
    public bool SiteImageIsVisible { get; set; } = true;
    public DateTimeOffset SiteImageCreatedTime { get; set; }
    public DateTimeOffset SiteImageModifiedTime { get; set; }
}