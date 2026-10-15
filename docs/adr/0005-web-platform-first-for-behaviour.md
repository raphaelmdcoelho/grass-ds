# Web platform first for interactive behaviour

Interactive behaviour uses native platform features (`<dialog>`, the Popover API, CSS anchor positioning) rather than Angular CDK or another framework library. Platform behaviour is identical in every implementation and in plain HTML, which keeps behaviour from drifting as well as appearance; a framework library would have to be replaced per framework. A library is adopted only where the platform demonstrably falls short.
