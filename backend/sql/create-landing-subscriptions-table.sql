-- =============================================
-- Create LandingSubscriptions Table
-- Database: FiveELMECommerce
-- =============================================

USE FiveELMECommerce;
GO

-- Check if table exists, if not create it
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LandingSubscriptions')
BEGIN
    CREATE TABLE LandingSubscriptions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        FirstName NVARCHAR(100) NOT NULL,
        LastName NVARCHAR(100) NOT NULL,
        Email NVARCHAR(255) NOT NULL UNIQUE,
        Phone NVARCHAR(20) NULL,
        Consent BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        IsActive BIT NOT NULL DEFAULT 1,
        Source NVARCHAR(50) NULL DEFAULT 'Landing Page',
        -- Optional fields for future use
        IPAddress NVARCHAR(50) NULL,
        UserAgent NVARCHAR(500) NULL,
        ReferralSource NVARCHAR(200) NULL
    );

    -- Create index on Email for faster lookups
    CREATE NONCLUSTERED INDEX IX_LandingSubscriptions_Email 
    ON LandingSubscriptions(Email);

    -- Create index on CreatedAt for reporting
    CREATE NONCLUSTERED INDEX IX_LandingSubscriptions_CreatedAt 
    ON LandingSubscriptions(CreatedAt DESC);

    PRINT '✅ LandingSubscriptions table created successfully!';
END
ELSE
BEGIN
    PRINT '⚠️ LandingSubscriptions table already exists.';
END
GO

-- Optional: Add trigger to update UpdatedAt automatically
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_LandingSubscriptions_UpdatedAt')
BEGIN
    EXEC('
    CREATE TRIGGER TR_LandingSubscriptions_UpdatedAt
    ON LandingSubscriptions
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        
        UPDATE LandingSubscriptions
        SET UpdatedAt = GETDATE()
        FROM LandingSubscriptions ls
        INNER JOIN inserted i ON ls.Id = i.Id;
    END
    ');
    
    PRINT '✅ Update trigger created successfully!';
END
GO

-- View table structure
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable,
    CASE WHEN pk.column_id IS NOT NULL THEN 'YES' ELSE 'NO' END AS IsPrimaryKey
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
LEFT JOIN (
    SELECT ic.column_id
    FROM sys.indexes i
    INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    WHERE i.is_primary_key = 1 AND i.object_id = OBJECT_ID('LandingSubscriptions')
) pk ON c.column_id = pk.column_id
WHERE c.object_id = OBJECT_ID('LandingSubscriptions')
ORDER BY c.column_id;

PRINT '📊 LandingSubscriptions table structure displayed above.';
GO
