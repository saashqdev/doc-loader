<template>
<u-linear-layout gap="small">
    <u-label v-for="label in labels" :key="label" v-tooltip.top="tooltips[label]">{{ label }}</u-label>
</u-linear-layout>
</template>

<script>
export default {
    props: {
        labels: Array,
    },
    data() {
        return {
            tooltips: {
                // component type
                'UI component': 'Generic UI component',
                'Icon component': 'A component containing a series of icons',
                'layout component': 'layout component',
                // component properties
                'Form control': 'This component inherits from MField and is often used in forms. It can be combined with UFormItem, UValidator and other components for form verification',
                'Form Validator': 'This component is a UValidator or inherits from UValidator and can recursively validate internal form validators or controls',
                'Router link': 'This component can easily add links or routes, similar to `<router-link>`. With href, target, to and other attributes, as well as @navigation and @before-navigation events',
                // display method
                'Inline display': 'Defaults to inline elements. If you want to switch to block-level display, please add the attribute `display="block"`',
                'Block-level display': 'Defaults to block-level elements. If you want to switch to inline display, please add the attribute `display="inline"`',
            },
        };
    },
};
</script>
