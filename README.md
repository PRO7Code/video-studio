# video-studio

استوديو إنتاج فيديو قابل لإعادة الاستخدام مع Claude Code: Remotion + الصوت (earshot / real-sound / real-sfx) + Higgsfield API (صور وفيديو بالذكاء الاصطناعي) + حماية المنتج والشعار.

## البدء في أي جلسة
```bash
bash scripts/bootstrap.sh     # يثبّت ما ينقص (يعمل تلقائيًا أيضًا عبر SessionStart hook)
bash scripts/doctor.sh        # ما يعمل وما يحتاج إعدادًا
```
ثم اطلب من Claude بلغة عادية، مثلًا: «أنتج اختبار رمادي لاونج حسب projects/restaurants/rimadi-lounge/qatayef-winter/run.md» — يتولى الـ skill `professional-video-director` الباقي ويطلب موافقتك قبل أي تكلفة أو رفع.

## البنية (Monorepo)
| المسار | المحتوى |
|---|---|
| `.claude/skills/professional-video-director/` | الـ skill الرئيسية ومراجعها |
| `core/remotion/` | محرك القوالب: `Ad`، `RimadiLookTest`، `RimadiLookCompare`، مكتبة `src/lib` |
| `tools/` | higgsfield (بتقدير وموافقة)، product_lock (place/lock)، audio (تفريغ، موسيقى، مؤثرات) |
| `registry/tools.yaml` | سجل الأدوات: الحالة، الترخيص، التكلفة، الحجم |
| `brands/` | هوية كل علامة (brand.json) — راجعها بعرض `Showcase-<id>` |
| `projects/anan/thursday-reel/` | أول مشروع تطبيقي: فيديو عنان المسلّم (كود فقط) |
| `projects/lef-academy/step-decode/` | STEP DECODE |
| `projects/tech-content/` | المحتوى التقني |
| `projects/restaurants/` | رمادي لاونج (اختبار القطايف)، هانم، هويو، SAND |
| `docs/` | القرارات، البيئة، الأبحاث |
| `scripts/` | bootstrap / doctor |

الوسائط والأصوات الخاصة والنماذج والأسرار لا تدخل git أبدًا (انظر `.gitignore`).

## المفاتيح
محليًا: `.env` (انظر `.env.example`). في الجلسات السحابية: احفظ المفتاح كـ network secret لـ `api.higgsfield.ai`
(Header: Authorization، البادئة: Key، القيمة: `<id>:<secret>`) — لا يمر في المحادثة ولا يُحفظ في المستودع.
