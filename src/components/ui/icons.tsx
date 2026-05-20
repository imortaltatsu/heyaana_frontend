/**
 * Centralized icon set.
 *
 * Wraps Hugeicons free icons behind the lucide-compatible names used across
 * the dashboard so call sites don't need to change. Pick from this file when
 * adding new icons so the dashboard stays visually consistent.
 */
import { forwardRef } from "react";
import { HugeiconsIcon, type HugeiconsProps } from "@hugeicons/react";
import {
  Activity01Icon,
  Alert01Icon,
  AlertDiamondIcon,
  Menu01Icon,
  LeftToRightListBulletIcon,
  ArrowDown01Icon,
  ArrowDownRight01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  ArrowUpRight01Icon,
  ArrowUpDownIcon,
  ArrowDataTransferHorizontalIcon,
  Upload02Icon,
  Download01Icon,
  Download04Icon,
  ChartBarLineIcon,
  Chart02Icon,
  ChartLineData01Icon,
  ChartIncreaseIcon,
  ChartDecreaseIcon,
  PieChart01Icon,
  Notification01Icon,
  Bookmark01Icon,
  Robot01Icon,
  CalculatorIcon,
  Tick01Icon,
  CheckmarkCircle01Icon,
  CheckmarkSquare01Icon,
  Clock01Icon,
  Clock03Icon,
  CommandIcon,
  Copy01Icon,
  CrownIcon,
  Dollar01Icon,
  DropletIcon,
  LinkSquare02Icon,
  ViewIcon,
  ViewOffIcon,
  File01Icon,
  FilterIcon,
  FilterHorizontalIcon,
  FishFoodIcon,
  FireIcon,
  GiftIcon,
  GitCompareIcon,
  Globe02Icon,
  Tag01Icon,
  Home01Icon,
  Image02Icon,
  InformationCircleIcon,
  Key01Icon,
  Layers01Icon,
  DashboardSquare01Icon,
  GridViewIcon,
  BulbIcon,
  Link01Icon,
  Loading03Icon,
  LockIcon,
  Login01Icon,
  Logout01Icon,
  Medal01Icon,
  PencilEdit01Icon,
  PercentIcon,
  PlusSignIcon,
  PowerIcon,
  RefreshIcon,
  Rocket01Icon,
  Search01Icon,
  Sent02Icon,
  Settings01Icon,
  Share01Icon,
  Shield01Icon,
  SecurityCheckIcon,
  SparklesIcon,
  StarIcon,
  Sun01Icon,
  Target02Icon,
  Delete02Icon,
  TriangleIcon,
  Award01Icon,
  UserIcon,
  UserMinus01Icon,
  UserAdd01Icon,
  UserGroupIcon,
  VolumeHighIcon,
  Wallet01Icon,
  FlashIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";

type IconData = NonNullable<HugeiconsProps["icon"]>;
type Props = Omit<HugeiconsProps, "icon">;

const make = (icon: IconData, displayName: string) => {
  const Cmp = forwardRef<SVGSVGElement, Props>(function Icon(props, ref) {
    return <HugeiconsIcon ref={ref} icon={icon} strokeWidth={1.75} {...props} />;
  });
  Cmp.displayName = displayName;
  return Cmp;
};

export const Activity = make(Activity01Icon, "Activity");
export const AlertCircle = make(Alert01Icon, "AlertCircle");
export const AlertTriangle = make(AlertDiamondIcon, "AlertTriangle");
export const TriangleAlert = make(AlertDiamondIcon, "TriangleAlert");
export const AlignJustify = make(Menu01Icon, "AlignJustify");
export const List = make(LeftToRightListBulletIcon, "List");

export const ArrowDown = make(ArrowDown01Icon, "ArrowDown");
export const ArrowDownRight = make(ArrowDownRight01Icon, "ArrowDownRight");
export const ArrowDownToLine = make(Download04Icon, "ArrowDownToLine");
export const ArrowLeft = make(ArrowLeft01Icon, "ArrowLeft");
export const ArrowLeftRight = make(ArrowDataTransferHorizontalIcon, "ArrowLeftRight");
export const ArrowRightLeft = make(ArrowDataTransferHorizontalIcon, "ArrowRightLeft");
export const ArrowUp = make(ArrowUp01Icon, "ArrowUp");
export const ArrowUpDown = make(ArrowUpDownIcon, "ArrowUpDown");
export const ArrowUpFromLine = make(Upload02Icon, "ArrowUpFromLine");
export const ArrowUpRight = make(ArrowUpRight01Icon, "ArrowUpRight");

export const BarChart2 = make(Chart02Icon, "BarChart2");
export const BarChart3 = make(ChartBarLineIcon, "BarChart3");
export const Bell = make(Notification01Icon, "Bell");
export const Bookmark = make(Bookmark01Icon, "Bookmark");
export const Bot = make(Robot01Icon, "Bot");
export const Calculator = make(CalculatorIcon, "Calculator");

export const Check = make(Tick01Icon, "Check");
export const CheckCircle2 = make(CheckmarkCircle01Icon, "CheckCircle2");
export const CheckSquare = make(CheckmarkSquare01Icon, "CheckSquare");

export const ChevronDown = make(ArrowDown01Icon, "ChevronDown");
export const ChevronLeft = make(ArrowLeft01Icon, "ChevronLeft");
export const ChevronRight = make(ArrowRight01Icon, "ChevronRight");

export const Clock = make(Clock01Icon, "Clock");
export const Clock3 = make(Clock03Icon, "Clock3");
export const Command = make(CommandIcon, "Command");
export const Copy = make(Copy01Icon, "Copy");
export const Crown = make(CrownIcon, "Crown");
export const DollarSign = make(Dollar01Icon, "DollarSign");
export const Download = make(Download01Icon, "Download");
export const Droplets = make(DropletIcon, "Droplets");
export const ExternalLink = make(LinkSquare02Icon, "ExternalLink");
export const Eye = make(ViewIcon, "Eye");
export const EyeOff = make(ViewOffIcon, "EyeOff");
export const FileText = make(File01Icon, "FileText");
export const Filter = make(FilterIcon, "Filter");
export const Fish = make(FishFoodIcon, "Fish");
export const Flame = make(FireIcon, "Flame");
export const Gift = make(GiftIcon, "Gift");
export const GitCompareArrows = make(GitCompareIcon, "GitCompareArrows");
export const Globe = make(Globe02Icon, "Globe");
export const Hash = make(Tag01Icon, "Hash");
export const Home = make(Home01Icon, "Home");
export const Images = make(Image02Icon, "Images");
export const Info = make(InformationCircleIcon, "Info");
export const KeyRound = make(Key01Icon, "KeyRound");
export const Layers = make(Layers01Icon, "Layers");
export const LayoutDashboard = make(DashboardSquare01Icon, "LayoutDashboard");
export const LayoutGrid = make(GridViewIcon, "LayoutGrid");
export const Lightbulb = make(BulbIcon, "Lightbulb");
export const LineChart = make(ChartLineData01Icon, "LineChart");
export const Link2 = make(Link01Icon, "Link2");
export const Loader2 = make(Loading03Icon, "Loader2");
export const Lock = make(LockIcon, "Lock");
export const LogIn = make(Login01Icon, "LogIn");
export const LogOut = make(Logout01Icon, "LogOut");
export const Medal = make(Medal01Icon, "Medal");
export const Pencil = make(PencilEdit01Icon, "Pencil");
export const Percent = make(PercentIcon, "Percent");
export const PieChart = make(PieChart01Icon, "PieChart");
export const PieChartIcon = make(PieChart01Icon, "PieChartIcon");
export const Plus = make(PlusSignIcon, "Plus");
export const Power = make(PowerIcon, "Power");
export const PowerOff = make(PowerIcon, "PowerOff");
export const RefreshCw = make(RefreshIcon, "RefreshCw");
export const Rocket = make(Rocket01Icon, "Rocket");
export const Search = make(Search01Icon, "Search");
export const Send = make(Sent02Icon, "Send");
export const Settings = make(Settings01Icon, "Settings");
export const Share2 = make(Share01Icon, "Share2");
export const Shield = make(Shield01Icon, "Shield");
export const ShieldAlert = make(SecurityCheckIcon, "ShieldAlert");
export const SlidersHorizontal = make(FilterHorizontalIcon, "SlidersHorizontal");
export const Sparkles = make(SparklesIcon, "Sparkles");
export const Star = make(StarIcon, "Star");
export const Sun = make(Sun01Icon, "Sun");
export const Target = make(Target02Icon, "Target");
export const Trash2 = make(Delete02Icon, "Trash2");
export const TrendingDown = make(ChartDecreaseIcon, "TrendingDown");
export const TrendingUp = make(ChartIncreaseIcon, "TrendingUp");
export const Triangle = make(TriangleIcon, "Triangle");
export const Trophy = make(Award01Icon, "Trophy");
export const User = make(UserIcon, "User");
export const UserMinus = make(UserMinus01Icon, "UserMinus");
export const UserPlus = make(UserAdd01Icon, "UserPlus");
export const Users = make(UserGroupIcon, "Users");
export const Volume2 = make(VolumeHighIcon, "Volume2");
export const Wallet = make(Wallet01Icon, "Wallet");
export const Zap = make(FlashIcon, "Zap");
export const X = make(Cancel01Icon, "X");
