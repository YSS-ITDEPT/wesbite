<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);


session_start();

$app = $_GET['apps'] ?? '';


if ($app === 'Web') {

    $_SESSION['app_user'] = 'public_web_access';
} else {

    if (!isset($_SESSION['app_user'])) {
        include('modal_login.php'); 
        exit();
    }
}


$con = mysqli_connect("localhost", "Anika12", "Anika12", "website_traffic");
if (!$con) {
    die("Connection failed: " . mysqli_connect_error());
}


function getDateRange($days) {
    return date('Y-m-d H:i:s', strtotime("-{$days} days"));
}

// Get filter parameters
$filter_days = isset($_GET['days']) ? (int)$_GET['days'] : 30;
$filter_country = isset($_GET['country']) ? mysqli_real_escape_string($con, $_GET['country']) : '';
$filter_device = isset($_GET['device']) ? mysqli_real_escape_string($con, $_GET['device']) : '';
$search_term = isset($_GET['search']) ? mysqli_real_escape_string($con, $_GET['search']) : '';

// Build WHERE clause for filters
$where_conditions = [];
if ($filter_days > 0) {
    $where_conditions[] = "visit_time >= '" . getDateRange($filter_days) . "'";
}

if (!empty($filter_country)) {
    $where_conditions[] = "address LIKE '%{$filter_country}%'";
}

if (!empty($search_term)) {
    $where_conditions[] = "(ip_address LIKE '%{$search_term}%' OR address LIKE '%{$search_term}%' OR page_url LIKE '%{$search_term}%')";
}

$where_clause = !empty($where_conditions) ? "WHERE " . implode(" AND ", $where_conditions) : "";

// 1. BASIC STATS
// Total visits (filtered)
$total_query = "SELECT COUNT(*) as total FROM website_traffic {$where_clause}";
$total_result = mysqli_query($con, $total_query);
$total_visits = mysqli_fetch_assoc($total_result)['total'];

// Unique visitors (filtered)
$unique_query = "SELECT COUNT(DISTINCT ip_address) as unique_count FROM website_traffic {$where_clause}";
$unique_result = mysqli_query($con, $unique_query);
$unique_count = mysqli_fetch_assoc($unique_result)['unique_count'];

// Today's visits
$today_query = "SELECT COUNT(*) as today_count FROM website_traffic WHERE DATE(visit_time) = CURDATE()";
$today_result = mysqli_query($con, $today_query);
$today_count = mysqli_fetch_assoc($today_result)['today_count'];

// Yesterday's visits
$yesterday_query = "SELECT COUNT(*) as yesterday_count FROM website_traffic WHERE DATE(visit_time) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
$yesterday_result = mysqli_query($con, $yesterday_query);
$yesterday_count = mysqli_fetch_assoc($yesterday_result)['yesterday_count'];

// 2. COUNTRY ANALYTICS
// Most visited countries (Last 30 days)
$countries_30_query = "
    SELECT 
        TRIM(SUBSTRING_INDEX(address, ',', -1)) as country,
        COUNT(*) as visit_count,
        COUNT(DISTINCT ip_address) as unique_visitors
    FROM website_traffic 
    WHERE visit_time >= '" . getDateRange(30) . "'
    AND address IS NOT NULL AND address != ''
    GROUP BY country 
    ORDER BY visit_count DESC 
    LIMIT 10
";
$countries_30_result = mysqli_query($con, $countries_30_query);

// Countries visited in last 15 days
$countries_15_query = "
    SELECT 
        TRIM(SUBSTRING_INDEX(address, ',', -1)) as country,
        COUNT(*) as visit_count,
        COUNT(DISTINCT ip_address) as unique_visitors,
        MAX(visit_time) as last_visit
    FROM website_traffic 
    WHERE visit_time >= '" . getDateRange(15) . "'
    AND address IS NOT NULL AND address != ''
    GROUP BY country 
    ORDER BY visit_count DESC
";
$countries_15_result = mysqli_query($con, $countries_15_query);

// 3. DAILY ANALYTICS (Last 7 days)
$daily_stats_query = "
    SELECT 
        DATE(visit_time) as visit_date,
        COUNT(*) as daily_visits,
        COUNT(DISTINCT ip_address) as daily_unique
    FROM website_traffic 
    WHERE visit_time >= '" . getDateRange(7) . "'
    GROUP BY DATE(visit_time) 
    ORDER BY visit_date DESC
";
$daily_stats_result = mysqli_query($con, $daily_stats_query);

// 8. DAILY COUNTRY DATA (for chart interaction)
$daily_country_query = "
    SELECT 
        DATE(visit_time) as visit_date,
        TRIM(SUBSTRING_INDEX(address, ',', -1)) as country,
        COUNT(*) as country_visits,
        COUNT(DISTINCT ip_address) as country_unique
    FROM website_traffic 
    WHERE visit_time >= '" . getDateRange(7) . "'
    AND address IS NOT NULL AND address != ''
    GROUP BY DATE(visit_time), country 
    ORDER BY visit_date DESC, country_visits DESC
";
$daily_country_result = mysqli_query($con, $daily_country_query);

// Convert to PHP array for JavaScript
$daily_country_data = [];
while ($row = mysqli_fetch_assoc($daily_country_result)) {
    $daily_country_data[$row['visit_date']][] = [
        'country' => $row['country'],
        'visits' => $row['country_visits'],
        'unique' => $row['country_unique']
    ];
}

// 4. DEVICE ANALYTICS
$device_stats_query = "
    SELECT 
        CASE 
            WHEN screen_width < 768 THEN 'Mobile'
            WHEN screen_width < 1025 THEN 'Tablet'
            WHEN screen_width < 1441 THEN 'Laptop'
            ELSE 'Desktop'
        END as device_type,
        COUNT(*) as device_count,
        COUNT(DISTINCT ip_address) as unique_users
    FROM website_traffic 
    WHERE visit_time >= '" . getDateRange($filter_days) . "'
    AND screen_width IS NOT NULL
    GROUP BY device_type 
    ORDER BY device_count DESC
";
$device_stats_result = mysqli_query($con, $device_stats_query);

// 5. TOP PAGES
$top_pages_query = "
    SELECT 
        page_url,
        COUNT(*) as page_visits,
        COUNT(DISTINCT ip_address) as unique_visitors
    FROM website_traffic 
    {$where_clause}
    GROUP BY page_url 
    ORDER BY page_visits DESC 
    LIMIT 10
";
$top_pages_result = mysqli_query($con, $top_pages_query);

// 6. REFERRER ANALYTICS
$referrer_stats_query = "
    SELECT 
        CASE 
            WHEN referrer = '' OR referrer IS NULL THEN 'Direct'
            WHEN referrer LIKE '%google%' THEN 'Google'
            WHEN referrer LIKE '%facebook%' THEN 'Facebook'
            WHEN referrer LIKE '%twitter%' THEN 'Twitter'
            WHEN referrer LIKE '%linkedin%' THEN 'LinkedIn'
            ELSE 'Other'
        END as referrer_type,
        COUNT(*) as referrer_count
    FROM website_traffic 
    {$where_clause}
    GROUP BY referrer_type 
    ORDER BY referrer_count DESC
";
$referrer_stats_result = mysqli_query($con, $referrer_stats_query);

// 7. GROWTH ANALYTICS
$current_period_start = getDateRange($filter_days);
$previous_period_start = getDateRange($filter_days * 2);
$previous_period_end = $current_period_start;

$growth_query = "
    SELECT 
        SUM(CASE WHEN visit_time >= '{$current_period_start}' THEN 1 ELSE 0 END) as current_visits,
        SUM(CASE WHEN visit_time >= '{$previous_period_start}' AND visit_time < '{$previous_period_end}' THEN 1 ELSE 0 END) as previous_visits
    FROM website_traffic
";
$growth_result = mysqli_query($con, $growth_query);
$growth_data = mysqli_fetch_assoc($growth_result);

$growth_percentage = 0;
if ($growth_data['previous_visits'] > 0) {
    $growth_percentage = (($growth_data['current_visits'] - $growth_data['previous_visits']) / $growth_data['previous_visits']) * 100;
}

// 8. RECENT TRAFFIC (with filters applied)
$recent_traffic_query = "
    SELECT * FROM website_traffic 
    {$where_clause}
    ORDER BY visit_time DESC 
    LIMIT 100
";
$recent_traffic_result = mysqli_query($con, $recent_traffic_query);

// Helper functions
function formatNumber($number) {
    if ($number >= 1000000) {
        return round($number / 1000000, 1) . 'M';
    } elseif ($number >= 1000) {
        return round($number / 1000, 1) . 'K';
    }
    return number_format($number);
}

function getCountryFlag($country) {
    $flags = [
        'India' => '🇮🇳',
        'United States' => '🇺🇸',
        'United Kingdom' => '🇬🇧',
        'Canada' => '🇨🇦',
        'Australia' => '🇦🇺',
        'Germany' => '🇩🇪',
        'France' => '🇫🇷',
        'Japan' => '🇯🇵',
        'China' => '🇨🇳',
        'Brazil' => '🇧🇷'
    ];
    return isset($flags[trim($country)]) ? $flags[trim($country)] : '🌍';
}

// Export functionality
// Export functionality
if (isset($_GET['export']) && $_GET['export'] == 'csv') {
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="website_traffic_' . date('Y-m-d') . '.csv"');
    
    $output = fopen('php://output', 'w');
    fputcsv($output, ['ID', 'IP Address', 'Location', 'Page URL', 'Referrer', 'Visit Time', 'Device Type', 'Language', 'Timezone']);
    
    // Run a fresh query with NO LIMIT so all filtered records are exported
    $export_query = "
        SELECT * FROM website_traffic 
        {$where_clause}
        ORDER BY visit_time DESC
    ";
    $export_result = mysqli_query($con, $export_query);
    
    while ($row = mysqli_fetch_assoc($export_result)) {
        $device_type = 'Desktop';
        if ($row['screen_width'] < 768) $device_type = 'Mobile';
        elseif ($row['screen_width'] < 1025) $device_type = 'Tablet';
        elseif ($row['screen_width'] < 1441) $device_type = 'Laptop';
        
        fputcsv($output, [
            $row['id'],
            $row['ip_address'],
            $row['address'],
            $row['page_url'],
            $row['referrer'],
            $row['visit_time'],
            $device_type,
            $row['language'] ?? '',
            $row['timezone'] ?? ''
        ]);
    }
    fclose($output);
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website Traffic Dashboard - Anika Sterilis</title>
    <link rel="shortcut icon" href="https://ik.imagekit.io/7oaqyvwnm/Untitled%20design%20(5).png?updatedAt=1726408067986" type="image/x-icon">
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap" rel="stylesheet">
    
    <!-- GSAP -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: {
                            50: '#f1f0fc',
                            100: '#e6e3f8',
                            200: '#d0ccf2',
                            300: '#aeabe8',
                            400: '#8882db',
                            500: '#6b5fcd',
                            600: '#5a45bd',
                            700: '#4d39a4',
                            800: '#412f87',
                            900: '#170f5f',
                            950: '#0f0a42'
                        }
                    }
                }
            }
        }
    </script>
    
    <style>
        body {
            font-family: "Quicksand", sans-serif;
            font-size: 0.875rem;
        }
        .compact-table td, .compact-table th {
            padding: 0.5rem 0.75rem;
        }
        .logo-image {
            width: 65px;
            height: 50px;
            object-fit: contain;
        }
        .india-flag-img {
            width: 45px;
            height: 30px;
            object-fit: cover;
            border: 1px solid #ddd;
            border-radius: 2px;
        }
        .chart-container {
            position: relative;
            height: 300px;
        }

/* Mobile-specific styles */
@media (max-width: 640px) {
    .compact-table td, .compact-table th {
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
    }
    
    .chart-container {
        height: 250px;
    }
    
    /* Hide less important columns on mobile */
    .mobile-hide {
        display: none;
    }
    
    /* Make cards more compact on mobile */
    .stats-card {
        padding: 0.75rem;
    }
    
    .stats-card p:first-child {
        font-size: 0.625rem;
    }
    
    .stats-card p:nth-child(2) {
        font-size: 1rem;
    }
}

/* Tablet styles */
@media (min-width: 641px) and (max-width: 1024px) {
    .compact-table td, .compact-table th {
        padding: 0.375rem 0.625rem;
        font-size: 0.8125rem;
    }
}
</style>
</head>

<body class="bg-slate-50 min-h-screen font-inter text-sm">
    <!-- Mobile-Responsive Header -->
<header class="bg-white shadow-sm border-b border-slate-200 header-animate">
    <div class="max-w-full mx-auto px-3 sm:px-4 lg:px-6">
        <div class="flex justify-between items-center py-2">
            <!-- Company Logo and Name -->
            <div class="flex items-center space-x-2 sm:space-x-3">
                <img src="https://ik.imagekit.io/d9wt8plt0/image.png?updatedAt=1726592318811"
                     alt="Anika Sterilis Logo" class="w-12 h-9 sm:w-16 sm:h-12 object-contain">
                <div>
                    <h1 class="text-sm sm:text-lg md:text-xl font-bold text-primary-900 leading-tight">
                        Anika Sterilis
                        <span class="hidden sm:inline">Private Limited</span>
                    </h1>
                </div>
            </div>
            
            <!-- Mobile Menu Button -->
            <button id="mobile-menu-btn" class="md:hidden bg-primary-50 hover:bg-primary-100 text-primary-900 p-2 rounded-lg transition-all duration-200">
                <i class="fas fa-bars text-sm"></i>
            </button>
            
            <!-- Desktop Header Actions -->
            <div class="hidden md:flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                    <img src="https://hrms.anikasterilis.com/public/flag.png"
                         alt="Indian Flag" class="w-8 h-5 object-cover border border-slate-300 rounded">
                    <span class="text-xs text-slate-600 font-medium">India</span>
                </div>
                <div class="text-slate-600 text-xs bg-slate-100 rounded-lg px-3 py-2">
                    <i class="fas fa-clock mr-1"></i>
                    <span id="current-time"></span>
                </div>
                <button class="bg-primary-50 hover:bg-primary-100 text-primary-900 p-2 rounded-lg transition-all duration-200" onclick="location.reload();">
                    <i class="fas fa-sync-alt text-sm"></i>
                </button>
            </div>
        </div>
        
        <!-- Mobile Header Actions -->
        <div class="md:hidden flex items-center justify-between py-2 border-t border-slate-100">
            <div class="flex items-center space-x-2">
                <img src="https://hrms.anikasterilis.com/public/flag.png"
                     alt="Indian Flag" class="w-6 h-4 object-cover border border-slate-300 rounded">
                <span class="text-xs text-slate-600 font-medium">India</span>
            </div>
            <div class="flex items-center space-x-2">
                <div class="text-slate-600 text-xs bg-slate-100 rounded px-2 py-1">
                    <i class="fas fa-clock mr-1"></i>
                    <span id="current-time-mobile"></span>
                </div>
                <button class="bg-primary-50 hover:bg-primary-100 text-primary-900 p-1.5 rounded transition-all duration-200" onclick="location.reload();">
                    <i class="fas fa-sync-alt text-xs"></i>
                </button>
            </div>
        </div>
    </div>
    
    <!-- Mobile Navigation Menu -->
    <nav id="mobile-nav" class="md:hidden bg-slate-50 border-t border-slate-200 hidden">
        <div class="max-w-full mx-auto px-3 py-2">
            <div class="grid grid-cols-2 gap-2">
                <a href="./index.html" class="text-slate-600 hover:text-slate-900 font-medium text-sm py-2 px-3 rounded hover:bg-slate-100 transition-colors">Home</a>
                <a href="./capabilities/newcap.html" class="text-slate-600 hover:text-slate-900 font-medium text-sm py-2 px-3 rounded hover:bg-slate-100 transition-colors">Capabilities</a>
                <a href="./solutions" class="text-slate-600 hover:text-slate-900 font-medium text-sm py-2 px-3 rounded hover:bg-slate-100 transition-colors">Solutions</a>
                <a href="./about/about" class="text-slate-600 hover:text-slate-900 font-medium text-sm py-2 px-3 rounded hover:bg-slate-100 transition-colors">Company</a>
                <a href="https://news.anikasterilis.com/" class="text-slate-600 hover:text-slate-900 font-medium text-sm py-2 px-3 rounded hover:bg-slate-100 transition-colors">News</a>
                <a href="./contact.html" class="text-slate-600 hover:text-slate-900 font-medium text-sm py-2 px-3 rounded hover:bg-slate-100 transition-colors">Contact</a>
                <a href="https://jobs.anikasterilis.com/jobs.php" class="text-slate-600 hover:text-slate-900 font-medium text-sm py-2 px-3 rounded hover:bg-slate-100 transition-colors">Career</a>
                <a href="#" class="text-primary-900 font-medium text-sm py-2 px-3 rounded bg-primary-100">Stats</a>
            </div>
        </div>
    </nav>
    
    <!-- Desktop Navigation -->
    <nav class="hidden md:block bg-slate-50 border-t border-slate-200">
        <div class="max-w-full mx-auto px-3 sm:px-4 lg:px-6">
            <div class="flex space-x-8 overflow-x-auto py-3">
                <a href="./index.html" class="text-slate-600 hover:text-slate-900 font-medium text-sm pb-2 transition-colors whitespace-nowrap">Home</a>
                <a href="./capabilities/newcap.html" class="text-slate-600 hover:text-slate-900 font-medium text-sm pb-2 transition-colors whitespace-nowrap">Capabilities</a>
                <a href="./solutions" class="text-slate-600 hover:text-slate-900 font-medium text-sm pb-2 transition-colors whitespace-nowrap">Solutions</a>
                <a href="./about/about" class="text-slate-600 hover:text-slate-900 font-medium text-sm pb-2 transition-colors whitespace-nowrap">Our Company</a>
                <a href="https://news.anikasterilis.com/" class="text-slate-600 hover:text-slate-900 font-medium text-sm pb-2 transition-colors whitespace-nowrap">News & Insights</a>
                <a href="./contact.html" class="text-slate-600 hover:text-slate-900 font-medium text-sm pb-2 transition-colors whitespace-nowrap">Contact Us</a>
                <a href="https://jobs.anikasterilis.com/jobs.php" class="text-slate-600 hover:text-slate-900 font-medium text-sm pb-2 transition-colors whitespace-nowrap">Career</a>
                <a href="#" class="text-primary-900 font-medium text-sm border-b-2 border-primary-900 pb-2 whitespace-nowrap">Website Stats</a>
<div class="flex-grow"></div>
    <a href="logout.php" class="text-white font-medium text-sm px-2 py-1 rounded transition-colors whitespace-nowrap" style="background-color: #170f5f;">Logout</a>
            </div>
        </div>
    </nav>
</header>

    <!-- Mobile-Responsive Dashboard Title -->
<div class="bg-primary-900 border-b border-slate-200">
    <div class="max-w-full mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2 sm:space-x-3">
                <div class="bg-white p-1.5 sm:p-2 rounded-lg">
                    <i class="fas fa-chart-line text-primary-900 text-sm sm:text-lg"></i>
                </div>
                <div>
                    <h2 class="text-sm sm:text-lg font-bold text-white">Website Analytics Dashboard</h2>
                    <p class="text-slate-300 text-xs hidden sm:block">Real-time Traffic Monitoring System</p>
                </div>
            </div>
        </div>
    </div>
</div>

    <main class="max-w-full mx-auto px-3 sm:px-4 lg:px-6 py-6">
        <!-- Mobile-Responsive Enhanced Filter Section -->
<div class="bg-white rounded-lg shadow-sm border border-slate-200 p-3 sm:p-4 mb-4 sm:mb-6 search-section">
    <form method="GET" class="space-y-3 sm:space-y-4">
        <!-- Mobile: Stack all filters vertically -->
        <div class="block sm:hidden space-y-3">
            <!-- Search Input -->
            <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Search</label>
                <div class="relative">
                    <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input type="text" name="search" value="<?php echo htmlspecialchars($search_term); ?>" 
                           class="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-primary-900 focus:border-primary-900" 
                           placeholder="Search IP, location, or page...">
                </div>
            </div>
            
            <!-- Time Period and Country in a row -->
            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label class="block text-xs font-medium text-slate-700 mb-1">Period</label>
                    <select name="days" class="w-full text-sm border border-slate-300 rounded-md px-2 py-2 focus:ring-1 focus:ring-primary-900">
                        <option value="7" <?php echo $filter_days == 7 ? 'selected' : ''; ?>>7 days</option>
                        <option value="15" <?php echo $filter_days == 15 ? 'selected' : ''; ?>>15 days</option>
                        <option value="30" <?php echo $filter_days == 30 ? 'selected' : ''; ?>>30 days</option>
                        <option value="90" <?php echo $filter_days == 90 ? 'selected' : ''; ?>>90 days</option>
                        <option value="0" <?php echo $filter_days == 0 ? 'selected' : ''; ?>>All</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-xs font-medium text-slate-700 mb-1">Country</label>
                    <input type="text" name="country" value="<?php echo htmlspecialchars($filter_country); ?>" 
                           class="w-full text-sm border border-slate-300 rounded-md px-2 py-2 focus:ring-1 focus:ring-primary-900" 
                           placeholder="Country">
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="grid grid-cols-3 gap-2">
                <button type="submit" class="bg-primary-900 hover:bg-primary-800 text-white text-xs px-3 py-2 rounded-md flex items-center justify-center space-x-1 transition-colors">
                    <i class="fas fa-filter text-xs"></i>
                    <span>Filter</span>
                </button>
                <a href="?export=csv&<?php echo http_build_query($_GET); ?>" 
                   class="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-md flex items-center justify-center space-x-1 transition-colors">
                    <i class="fas fa-download text-xs"></i>
                    <span>Export</span>
                </a>
                <a href="?" class="bg-slate-500 hover:bg-slate-600 text-white text-xs px-3 py-2 rounded-md flex items-center justify-center space-x-1 transition-colors">
                    <i class="fas fa-times text-xs"></i>
                    <span>Clear</span>
                </a>
            </div>
        </div>
        
        <!-- Desktop: Original horizontal layout -->
        <div class="hidden sm:flex flex-col lg:flex-row gap-4 items-end">
            <!-- Search Input -->
            <div class="flex-1 max-w-sm">
                <label class="block text-xs font-medium text-slate-700 mb-1">Search</label>
                <div class="relative">
                    <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input type="text" name="search" value="<?php echo htmlspecialchars($search_term); ?>" 
                           class="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-primary-900 focus:border-primary-900" 
                           placeholder="Search IP, location, or page...">
                </div>
            </div>
            
            <!-- Time Period Filter -->
            <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Time Period</label>
                <select name="days" class="text-sm border border-slate-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-primary-900">
                    <option value="7" <?php echo $filter_days == 7 ? 'selected' : ''; ?>>Last 7 days</option>
                    <option value="15" <?php echo $filter_days == 15 ? 'selected' : ''; ?>>Last 15 days</option>
                    <option value="30" <?php echo $filter_days == 30 ? 'selected' : ''; ?>>Last 30 days</option>
                    <option value="90" <?php echo $filter_days == 90 ? 'selected' : ''; ?>>Last 90 days</option>
                    <option value="0" <?php echo $filter_days == 0 ? 'selected' : ''; ?>>All Time</option>
                </select>
            </div>
            
            <!-- Country Filter -->
            <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Country</label>
                <input type="text" name="country" value="<?php echo htmlspecialchars($filter_country); ?>" 
                       class="text-sm border border-slate-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-primary-900" 
                       placeholder="Filter by country">
            </div>
            
            <!-- Action Buttons -->
            <div class="flex gap-2">
                <button type="submit" class="bg-primary-900 hover:bg-primary-800 text-white text-sm px-4 py-2 rounded-md flex items-center space-x-1 transition-colors">
                    <i class="fas fa-filter text-xs"></i>
                    <span>Apply Filters</span>
                </button>
                <a href="?export=csv&<?php echo http_build_query($_GET); ?>" 
                   class="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-md flex items-center space-x-1 transition-colors">
                    <i class="fas fa-download text-xs"></i>
                    <span>Export CSV</span>
                </a>
                <a href="?" class="bg-slate-500 hover:bg-slate-600 text-white text-sm px-4 py-2 rounded-md flex items-center space-x-1 transition-colors">
                    <i class="fas fa-times text-xs"></i>
                    <span>Clear</span>
                </a>
            </div>
        </div>
    </form>
</div>

        <!-- Mobile-Responsive Stats Grid -->
<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <!-- Total Visits -->
            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4 stats-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Visits</p>
                        <p class="text-lg font-bold text-slate-900" id="total-visits"><?php echo formatNumber($total_visits); ?></p>
                        <?php if ($growth_percentage != 0): ?>
                            <p class="text-xs <?php echo $growth_percentage > 0 ? 'text-green-600' : 'text-red-600'; ?>">
                                <i class="fas fa-arrow-<?php echo $growth_percentage > 0 ? 'up' : 'down'; ?> mr-1"></i>
                                <?php echo abs(round($growth_percentage, 1)); ?>%
                            </p>
                        <?php endif; ?>
                    </div>
                    <div class="bg-primary-50 p-2 rounded-lg">
                        <i class="fas fa-eye text-primary-900 text-sm"></i>
                    </div>
                </div>
            </div>

            <!-- Unique Visitors -->
            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4 stats-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Unique Visitors</p>
                        <p class="text-lg font-bold text-slate-900"><?php echo formatNumber($unique_count); ?></p>
                    </div>
                    <div class="bg-green-50 p-2 rounded-lg">
                        <i class="fas fa-users text-green-600 text-sm"></i>
                    </div>
                </div>
            </div>

            <!-- Today's Visits -->
            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4 stats-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Today</p>
                        <p class="text-lg font-bold text-slate-900"><?php echo formatNumber($today_count); ?></p>
                    </div>
                    <div class="bg-blue-50 p-2 rounded-lg">
                        <i class="fas fa-calendar-day text-blue-600 text-sm"></i>
                    </div>
                </div>
            </div>

            <!-- Yesterday's Visits -->
            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4 stats-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Yesterday</p>
                        <p class="text-lg font-bold text-slate-900"><?php echo formatNumber($yesterday_count); ?></p>
                    </div>
                    <div class="bg-purple-50 p-2 rounded-lg">
                        <i class="fas fa-calendar-minus text-purple-600 text-sm"></i>
                    </div>
                </div>
            </div>

            <!-- Live Status -->
            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4 stats-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</p>
                        <p class="text-lg font-bold text-green-600">Live</p>
                    </div>
                    <div class="bg-green-50 p-2 rounded-lg">
                        <i class="fas fa-circle text-green-500 text-xs animate-pulse"></i>
                    </div>
                </div>
            </div>

            <!-- Bounce Rate -->
            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4 stats-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Avg. Session</p>
                        <p class="text-lg font-bold text-slate-900">2.5m</p>
                    </div>
                    <div class="bg-orange-50 p-2 rounded-lg">
                        <i class="fas fa-clock text-orange-600 text-sm"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mobile-Responsive Analytics Grid -->
<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
            <!-- Countries Last 15 Days -->
            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                <h3 class="text-base font-semibold text-slate-900 mb-4 flex items-center">
                    <i class="fas fa-globe mr-2 text-slate-600"></i>
                    Countries (Last 15 Days)
                </h3>
                <div class="space-y-2 max-h-64 overflow-y-auto">
                    <?php while ($country = mysqli_fetch_assoc($countries_15_result)): ?>
                        <div class="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                            <div class="flex items-center space-x-2">
                                <span class="text-lg"><?php echo getCountryFlag($country['country']); ?></span>
                                <span class="text-sm font-medium text-slate-900"><?php echo htmlspecialchars($country['country']); ?></span>
                            </div>
                            <div class="text-right">
                                <div class="text-sm font-bold text-slate-900"><?php echo $country['visit_count']; ?></div>
                                <div class="text-xs text-slate-500"><?php echo $country['unique_visitors']; ?> unique</div>
                            </div>
                        </div>
                    <?php endwhile; ?>
                </div>
            </div>

            <!-- Most Visited Countries (30 Days) -->
            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                <h3 class="text-base font-semibold text-slate-900 mb-4 flex items-center">
                    <i class="fas fa-trophy mr-2 text-slate-600"></i>
                    Top Countries (30 Days)
                </h3>
                <div class="space-y-2 max-h-64 overflow-y-auto">
                    <?php 
                    $rank = 1;
                    while ($country = mysqli_fetch_assoc($countries_30_result)): 
                    ?>
                        <div class="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                            <div class="flex items-center space-x-3">
                                <span class="inline-flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-900 rounded-full text-xs font-bold">
                                    <?php echo $rank++; ?>
                                </span>
                                <span class="text-lg"><?php echo getCountryFlag($country['country']); ?></span>
                                <span class="text-sm font-medium text-slate-900"><?php echo htmlspecialchars($country['country']); ?></span>
                            </div>
                            <div class="text-right">
                                <div class="text-sm font-bold text-slate-900"><?php echo $country['visit_count']; ?></div>
                                <div class="text-xs text-slate-500"><?php echo $country['unique_visitors']; ?> unique</div>
                            </div>
                        </div>
                    <?php endwhile; ?>
                </div>
            </div>

            <!-- Device Analytics -->
            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                <h3 class="text-base font-semibold text-slate-900 mb-4 flex items-center">
                    <i class="fas fa-devices mr-2 text-slate-600"></i>
                    Device Breakdown
                </h3>
                <div class="space-y-3">
                    <?php while ($device = mysqli_fetch_assoc($device_stats_result)): ?>
                        <?php 
                        $percentage = $total_visits > 0 ? round(($device['device_count'] / $total_visits) * 100, 1) : 0;
                        $icon_class = '';
                        $color_class = '';
                        switch($device['device_type']) {
                            case 'Mobile': $icon_class = 'fa-mobile-alt'; $color_class = 'bg-pink-500'; break;
                            case 'Tablet': $icon_class = 'fa-tablet-alt'; $color_class = 'bg-orange-500'; break;
                            case 'Laptop': $icon_class = 'fa-laptop'; $color_class = 'bg-blue-500'; break;
                            case 'Desktop': $icon_class = 'fa-desktop'; $color_class = 'bg-purple-500'; break;
                        }
                        ?>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <i class="fas <?php echo $icon_class; ?> text-slate-600"></i>
                                <span class="text-sm font-medium text-slate-900"><?php echo $device['device_type']; ?></span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <div class="text-sm font-bold text-slate-900"><?php echo $device['device_count']; ?></div>
                                <div class="text-xs text-slate-500">(<?php echo $percentage; ?>%)</div>
                            </div>
                        </div>
                        <div class="w-full bg-slate-200 rounded-full h-2">
                            <div class="<?php echo $color_class; ?> h-2 rounded-full" style="width: <?php echo $percentage; ?>%"></div>
                        </div>
                    <?php endwhile; ?>
                </div>
            </div>
        </div>

        <!-- Mobile-Responsive Additional Analytics Grid -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6">
            <!-- Top Pages -->
            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                <h3 class="text-base font-semibold text-slate-900 mb-4 flex items-center">
                    <i class="fas fa-file-alt mr-2 text-slate-600"></i>
                    Top Pages
                </h3>
                <div class="space-y-2 max-h-64 overflow-y-auto">
                    <?php while ($page = mysqli_fetch_assoc($top_pages_result)): ?>
                        <div class="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                            <div class="flex-1 min-w-0">
                                <div class="text-sm font-medium text-slate-900 truncate"><?php echo htmlspecialchars($page['page_url']); ?></div>
                                <div class="text-xs text-slate-500"><?php echo $page['unique_visitors']; ?> unique visitors</div>
                            </div>
                            <div class="text-sm font-bold text-slate-900 ml-2"><?php echo $page['page_visits']; ?></div>
                        </div>
                    <?php endwhile; ?>
                </div>
            </div>

            <!-- Referrer Sources -->
            <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                <h3 class="text-base font-semibold text-slate-900 mb-4 flex items-center">
                    <i class="fas fa-external-link-alt mr-2 text-slate-600"></i>
                    Traffic Sources
                </h3>
                <div class="space-y-3">
                    <?php while ($referrer = mysqli_fetch_assoc($referrer_stats_result)): ?>
                        <?php 
                        $percentage = $total_visits > 0 ? round(($referrer['referrer_count'] / $total_visits) * 100, 1) : 0;
                        $icon_class = '';
                        $color_class = '';
                        switch($referrer['referrer_type']) {
                            case 'Direct': $icon_class = 'fa-link'; $color_class = 'bg-gray-500'; break;
                            case 'Google': $icon_class = 'fa-google'; $color_class = 'bg-blue-500'; break;
                            case 'Facebook': $icon_class = 'fa-facebook'; $color_class = 'bg-blue-600'; break;
                            case 'Twitter': $icon_class = 'fa-twitter'; $color_class = 'bg-sky-500'; break;
                            case 'LinkedIn': $icon_class = 'fa-linkedin'; $color_class = 'bg-blue-700'; break;
                            default: $icon_class = 'fa-globe'; $color_class = 'bg-green-500'; break;
                        }
                        ?>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <i class="fab <?php echo $icon_class; ?> text-slate-600"></i>
                                <span class="text-sm font-medium text-slate-900"><?php echo $referrer['referrer_type']; ?></span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <div class="text-sm font-bold text-slate-900"><?php echo $referrer['referrer_count']; ?></div>
                                <div class="text-xs text-slate-500">(<?php echo $percentage; ?>%)</div>
                            </div>
                        </div>
                        <div class="w-full bg-slate-200 rounded-full h-2">
                            <div class="<?php echo $color_class; ?> h-2 rounded-full" style="width: <?php echo $percentage; ?>%"></div>
                        </div>
                    <?php endwhile; ?>
                </div>
            </div>
        </div>

        <!-- Enhanced Interactive Daily Stats Chart -->
<div class="bg-white rounded-lg shadow-sm border border-slate-200 p-3 sm:p-4 mb-4 sm:mb-6">
    <h3 class="text-sm sm:text-base font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center">
        <i class="fas fa-chart-line mr-2 text-slate-600"></i>
        Daily Traffic (Last 7 Days)
        <span class="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Click points for details</span>
    </h3>
    <div class="chart-container" style="height: 250px;">
        <canvas id="dailyChart"></canvas>
    </div>
</div>

<!-- Modal for Country Details -->
<div id="countryModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-hidden">
        <div class="bg-primary-900 text-white p-4 flex items-center justify-between">
            <h4 class="text-lg font-semibold flex items-center">
                <i class="fas fa-globe mr-2"></i>
                <span id="modalTitle">Country Details</span>
            </h4>
<button id="closeModal" class="text-white hover:text-gray-300 transition-colors" onclick="document.getElementById('countryModal').style.display='none'; document.getElementById('countryModal').classList.add('hidden'); document.body.style.overflow='auto'; document.body.style.overflowY='auto'; document.documentElement.style.overflow='auto';">
    <i class="fas fa-times text-lg"></i>
</button>
        </div>
        <div class="p-4">
            <div id="modalContent" class="space-y-3 max-h-64 overflow-y-auto">
                <!-- Country data will be populated here -->
            </div>
        </div>
        <div class="bg-slate-50 px-4 py-3 border-t">
            <div class="flex items-center justify-between text-sm text-slate-600">
                <span id="modalStats">Total countries: 0</span>
         
            </div>
        </div>
    </div>
</div>

        <!-- Recent Traffic Table -->
        <div class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden table-section">
            <div class="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div class="flex items-center justify-between">
                    <h3 class="text-base font-semibold text-slate-900 flex items-center">
                        <i class="fas fa-table mr-2 text-slate-600"></i>
                        Recent Traffic (Last 100)
                        <?php if ($filter_days > 0 || !empty($filter_country) || !empty($search_term)): ?>
                            <span class="ml-2 text-xs bg-primary-100 text-primary-900 px-2 py-1 rounded">Filtered</span>
                        <?php endif; ?>
                    </h3>
                    <span class="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        <i class="fas fa-clock mr-1"></i>
                        Auto-refresh: 60s
                    </span>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200 compact-table">
                    <thead class="bg-slate-50">
                        <tr>
                            <th class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider">#</th>
                            <th class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                <i class="fas fa-network-wired mr-1"></i>IP Address
                            </th>
                            <th class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                <i class="fas fa-map-marker-alt mr-1"></i>Location
                            </th>
                            <th class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                <i class="fas fa-link mr-1"></i>Page
                            </th>
                            <th class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider mobile-hide">
                                <i class="fas fa-external-link-alt mr-1"></i>Referrer
                            </th>
                            <th class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                <i class="fas fa-clock mr-1"></i>Time
                            </th>
                            <th class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                <i class="fas fa-desktop mr-1"></i>Device
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-slate-100" id="traffic-table-body">
                        <?php while($row = mysqli_fetch_assoc($recent_traffic_result)): ?>
                        <tr class="hover:bg-slate-50 transition-colors duration-200 table-row">
                            <td class="whitespace-nowrap text-xs font-medium text-slate-900">
                                <span class="inline-flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-900 rounded-full text-xs font-bold">
                                    <?php echo htmlspecialchars($row['id']); ?>
                                </span>
                            </td>
                            <td class="whitespace-nowrap text-xs text-slate-900">
                                <code class="bg-slate-100 px-2 py-1 rounded text-xs font-mono"><?php echo htmlspecialchars($row['ip_address']); ?></code>
                            </td>
                            <td class="text-xs text-slate-900 max-w-xs">
                                <div class="flex flex-col">
                                    <span class="font-medium truncate"><?php echo htmlspecialchars($row['address']); ?></span>
                                    <?php if (!empty($row['lat']) && !empty($row['lon'])): ?>
                                        <a href="https://www.google.com/maps?q=<?php echo $row['lat']; ?>,<?php echo $row['lon']; ?>" target="_blank"
                                           class="text-primary-900 hover:text-primary-800 text-xs mt-1 inline-flex items-center transition-colors duration-200">
                                            <i class="fas fa-map text-xs mr-1"></i>
                                            View Map
                                        </a>
                                    <?php endif; ?>
                                </div>
                            </td>
                            <td class="text-xs text-slate-900 max-w-xs">
                                <span class="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full truncate block">
                                    <?php echo htmlspecialchars($row['page_url']); ?>
                                </span>
                            </td>
                            <td class="text-xs text-slate-500 max-w-xs mobile-hide">
                                <span class="truncate block"><?php echo htmlspecialchars($row['referrer']); ?></span>
                            </td>
                            <td class="whitespace-nowrap text-xs text-slate-900">
                                <div class="flex flex-col">
                                   <span class="font-medium"><?php echo date('M j', strtotime($row['visit_time'] . ' +5 hours 30 minutes')); ?></span>
                             <span class="text-slate-500 text-xs"><?php echo date('g:i A', strtotime($row['visit_time'] . ' +5 hours 30 minutes')); ?></span>
                                </div>
                            </td>
                            <td class="whitespace-nowrap text-xs text-slate-900">
                                <?php
                                $w = isset($row['screen_width']) ? $row['screen_width'] : 0;
                                if ($w < 768) {
                                    echo '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-50 text-pink-700"><i class="fas fa-mobile-alt text-xs mr-1"></i>Mobile</span><div class="text-xs text-slate-500 mt-1">' . $w . 'px</div>';
                                } elseif ($w < 1025) {
                                    echo '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700"><i class="fas fa-tablet-alt text-xs mr-1"></i>Tablet</span><div class="text-xs text-slate-500 mt-1">' . $w . 'px</div>';
                                } elseif ($w < 1441) {
                                    echo '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"><i class="fas fa-laptop text-xs mr-1"></i>Laptop</span><div class="text-xs text-slate-500 mt-1">' . $w . 'px</div>';
                                } else {
                                    echo '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700"><i class="fas fa-desktop text-xs mr-1"></i>Desktop</span><div class="text-xs text-slate-500 mt-1">' . $w . 'px</div>';
                                }
                                ?>
                            </td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-primary-950 text-white mt-12 footer-animate">
        <div class="max-w-full mx-auto px-3 sm:px-4 lg:px-6 py-4">
            <div class="pt-4">
                <div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <div class="flex items-center space-x-4">
                        <p class="text-slate-400 text-xs">
                            © <?php echo date('Y'); ?> Anika Sterilis Private Limited. All rights reserved.
                        </p>
                    </div>
                    <div class="flex items-center space-x-6">
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-code text-primary-400 text-sm"></i>
                            <span class="text-slate-400 text-xs">Powered by</span>
                            <span class="text-white font-semibold text-sm">Anika Sterilis</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </footer>

    <script>
// Add mobile menu functionality and responsive chart handling
document.addEventListener('DOMContentLoaded', function() {
    console.log('Enhanced mobile-responsive dashboard loaded');
    
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileNav.classList.toggle('hidden');
            const icon = mobileMenuBtn.querySelector('i');
            if (mobileNav.classList.contains('hidden')) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            } else {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            }
        });
    }
    
    // Update time for both desktop and mobile
    function updateTime() {
        const timeElement = document.getElementById('current-time');
        const mobileTimeElement = document.getElementById('current-time-mobile');
        if (timeElement || mobileTimeElement) {
            const now = new Date();
            const timeString = now.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            if (timeElement) timeElement.textContent = timeString;
            if (mobileTimeElement) mobileTimeElement.textContent = timeString;
        }
    }
    updateTime();
    setInterval(updateTime, 1000);
    
    // GSAP Animations (existing code)
    if (typeof gsap !== 'undefined') {
        gsap.from('.header-animate', {
            duration: 0.8,
            y: -30,
            opacity: 0,
            ease: "power2.out"
        });
        
        gsap.from('.stats-card', {
            duration: 0.6,
            scale: 0.9,
            opacity: 0,
            stagger: 0.1,
            ease: "back.out(1.2)",
            delay: 0.2
        });
        
        gsap.from('.search-section', {
            duration: 0.8,
            x: -50,
            opacity: 0,
            ease: "power2.out",
            delay: 0.4
        });
        
        gsap.from('.table-section', {
            duration: 0.8,
            y: 30,
            opacity: 0,
            ease: "power2.out",
            delay: 0.6
        });
        
        gsap.from('.table-row', {
            duration: 0.4,
            y: 10,
            opacity: 0,
            stagger: 0.03,
            ease: "power1.out",
            delay: 0.8
        });
        
        gsap.from('.footer-animate', {
            duration: 0.8,
            y: 50,
            opacity: 0,
            ease: "power2.out",
            delay: 1.0
        });
    }
    
    // Enhanced Daily Chart with Click Interaction
const dailyChartCtx = document.getElementById('dailyChart');

// Define dailyCountryData in global scope
let dailyCountryData = {};

if (dailyChartCtx) {
    // PHP data for chart
    const dailyData = [<?php 
    mysqli_data_seek($daily_stats_result, 0);
    $daily_labels = [];
    $daily_visits = [];
    $daily_unique = [];
    $daily_dates = [];
    while ($daily = mysqli_fetch_assoc($daily_stats_result)) {
        $daily_labels[] = "'" . date('M j', strtotime($daily['visit_date'])) . "'";
        $daily_visits[] = $daily['daily_visits'];
        $daily_unique[] = $daily['daily_unique'];
        $daily_dates[] = "'" . $daily['visit_date'] . "'";
    }
    echo implode(',', array_reverse($daily_visits));
    ?>];
    
    const dailyUniqueData = [<?php echo implode(',', array_reverse($daily_unique)); ?>];
    const dailyLabels = [<?php echo implode(',', array_reverse($daily_labels)); ?>];
    const dailyDates = [<?php echo implode(',', array_reverse($daily_dates)); ?>];
    
    // Country data for each day - assign to global variable
    dailyCountryData = <?php echo json_encode($daily_country_data); ?>;
    
    const chart = new Chart(dailyChartCtx, {
        type: 'line',
        data: {
            labels: dailyLabels,
            datasets: [{
                label: 'Total Visits',
                data: dailyData,
                borderColor: '#6b5fcd',
                backgroundColor: 'rgba(107, 95, 205, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#6b5fcd',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }, {
                label: 'Unique Visitors',
                data: dailyUniqueData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        font: {
                            size: window.innerWidth < 640 ? 10 : 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            return 'Click to see country details';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: window.innerWidth < 640 ? 10 : 12
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: window.innerWidth < 640 ? 10 : 12
                        }
                    }
                }
            },
            onClick: function(event, elements) {
                if (elements.length > 0) {
                    const elementIndex = elements[0].index;
                    const selectedDate = dailyDates[elementIndex].replace(/'/g, '');
                    const selectedLabel = dailyLabels[elementIndex].replace(/'/g, '');
                    
                    showCountryModal(selectedDate, selectedLabel);
                }
            }
        }
    });
}

// Modal functionality - moved outside the chart initialization
function showCountryModal(date, label) {
    const modal = document.getElementById('countryModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const modalStats = document.getElementById('modalStats');
    
    if (!modal || !modalTitle || !modalContent || !modalStats) {
        console.error('Modal elements not found');
        return;
    }
    
    modalTitle.textContent = `Countries for ${label}`;
    
    const countryData = dailyCountryData[date] || [];
    
    if (countryData.length === 0) {
        modalContent.innerHTML = '<div class="text-center text-slate-500 py-4"><i class="fas fa-globe text-2xl mb-2"></i><br>No country data available for this date</div>';
        modalStats.textContent = 'Total countries: 0';
    } else {
        let totalVisits = 0;
        let totalUnique = 0;
        
        const countryHTML = countryData.map((country, index) => {
            totalVisits += parseInt(country.visits);
            totalUnique += parseInt(country.unique);
            
            const flag = getCountryFlagJS(country.country);
            const totalDayVisits = countryData.reduce((sum, c) => sum + parseInt(c.visits), 0);
            const percentage = totalDayVisits > 0 ? ((country.visits / totalDayVisits) * 100).toFixed(1) : 0;
            
            return `
                <div class="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg border border-slate-100 transition-colors">
                    <div class="flex items-center space-x-3">
                        <span class="inline-flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-900 rounded-full text-xs font-bold">
                            ${index + 1}
                        </span>
                        <span class="text-lg">${flag}</span>
                        <div>
                            <div class="text-sm font-medium text-slate-900">${country.country}</div>
                            <div class="text-xs text-slate-500">${country.unique} unique visitors</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-sm font-bold text-slate-900">${country.visits}</div>
                        <div class="text-xs text-slate-500">${percentage}%</div>
                    </div>
                </div>
            `;
        }).join('');
        
        modalContent.innerHTML = countryHTML;
        modalStats.textContent = `Total countries: ${countryData.length} | Visits: ${totalVisits} | Unique: ${totalUnique}`;
    }
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    modal.style.display = 'flex'; 
}



// Helper function for country flags in JavaScript
function getCountryFlagJS(country) {
    const flags = {
        'India': '🇮🇳',
        'United States': '🇺🇸',
        'United Kingdom': '🇬🇧',
        'Canada': '🇨🇦',
        'Australia': '🇦🇺',
        'Germany': '🇩🇪',
        'France': '🇫🇷',
        'Japan': '🇯🇵',
        'China': '🇨🇳',
        'Brazil': '🇧🇷',
        'Russia': '🇷🇺',
        'Italy': '🇮🇹',
        'Spain': '🇪🇸',
        'Netherlands': '🇳🇱',
        'South Korea': '🇰🇷',
        'Mexico': '🇲🇽',
        'Argentina': '🇦🇷',
        'South Africa': '🇿🇦',
        'Egypt': '🇪🇬',
        'Turkey': '🇹🇷'
    };
    return flags[country.trim()] || '🌍';
}


    
    // Auto-refresh every 30 seconds
    setTimeout(function() {
        location.reload();
    }, 60000);
});
</script>
</body>
</html>

<?php
mysqli_close($con);
?>
